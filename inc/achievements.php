<?php
/**
 * Osiągnięcia w panelu WordPressa i na stronie „O mnie”.
 *
 * @package Labus
 */

defined( 'ABSPATH' ) || exit;

/**
 * Zwraca kategorie w kolejności wyświetlania na stronie.
 *
 * @return array<string, string>
 */
function labus_achievement_groups() {
	return array(
		'research' => __( 'Globalne doświadczenie (Staże naukowe)', 'labus' ),
		'awards'   => __( 'Kluczowe nagrody i wyróżnienia', 'labus' ),
		'impact'   => __( 'Wpływ realny i wdrożenia', 'labus' ),
	);
}

/**
 * Rejestruje wpisy edytowane w panelu, bez osobnych stron osiągnięć.
 */
function labus_register_achievements() {
	register_post_type(
		'labus_achievement',
		array(
			'labels'       => array(
				'name'          => __( 'Osiągnięcia', 'labus' ),
				'singular_name' => __( 'Osiągnięcie', 'labus' ),
				'add_new'       => __( 'Dodaj osiągnięcie', 'labus' ),
				'add_new_item'  => __( 'Dodaj osiągnięcie', 'labus' ),
				'edit_item'     => __( 'Edytuj osiągnięcie', 'labus' ),
				'all_items'     => __( 'Wszystkie osiągnięcia', 'labus' ),
			),
			'public'       => false,
			'show_ui'      => true,
			'show_in_rest' => true,
			'map_meta_cap' => true,
			'menu_icon'    => 'dashicons-awards',
			'rewrite'      => false,
			'supports'     => array( 'title', 'editor', 'revisions' ),
			'template'     => array(
				array( 'core/paragraph', array( 'placeholder' => __( 'Wpisz opis, który rozwinie się pod tytułem na stronie.', 'labus' ) ) ),
			),
		)
	);
}
add_action( 'init', 'labus_register_achievements' );

/**
 * Dodaje pola kategorii i okresu obok edytora opisu.
 */
function labus_add_achievement_fields() {
	add_meta_box( 'labus-achievement-fields', __( 'Szczegóły osiągnięcia', 'labus' ), 'labus_render_achievement_fields', 'labus_achievement', 'side' );
}
add_action( 'add_meta_boxes_labus_achievement', 'labus_add_achievement_fields' );

/**
 * Wyświetla pola kategorii i okresu.
 *
 * @param WP_Post $post Edytowane osiągnięcie.
 */
function labus_render_achievement_fields( $post ) {
	$groups = labus_achievement_groups();
	$group  = get_post_meta( $post->ID, '_labus_achievement_group', true );
	$period = get_post_meta( $post->ID, '_labus_achievement_period', true );
	if ( ! isset( $groups[ $group ] ) ) {
		$group = 'research';
	}
	wp_nonce_field( 'labus_save_achievement', 'labus_achievement_nonce' );
	?>
	<p>
		<label for="labus-achievement-group"><?php esc_html_e( 'Kategoria', 'labus' ); ?></label><br>
		<select id="labus-achievement-group" name="labus_achievement_group" class="widefat">
			<?php foreach ( $groups as $key => $label ) : ?>
				<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $group, $key ); ?>><?php echo esc_html( $label ); ?></option>
			<?php endforeach; ?>
		</select>
	</p>
	<p>
		<label for="labus-achievement-period"><?php esc_html_e( 'Rok lub okres', 'labus' ); ?></label><br>
		<input id="labus-achievement-period" name="labus_achievement_period" class="widefat" type="text" value="<?php echo esc_attr( $period ); ?>" placeholder="<?php esc_attr_e( 'np. 2024–2026 lub od 2016', 'labus' ); ?>">
	</p>
	<?php
}

/**
 * Zapisuje pola po uprawnionej edycji w panelu WordPressa.
 *
 * @param int $post_id Identyfikator osiągnięcia.
 */
function labus_save_achievement_fields( $post_id ) {
	if ( ! isset( $_POST['labus_achievement_nonce'], $_POST['labus_achievement_group'], $_POST['labus_achievement_period'] ) ||
		! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['labus_achievement_nonce'] ) ), 'labus_save_achievement' ) ||
		! current_user_can( 'edit_post', $post_id ) || wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}

	$group  = sanitize_key( wp_unslash( $_POST['labus_achievement_group'] ) );
	$period = sanitize_text_field( wp_unslash( $_POST['labus_achievement_period'] ) );
	if ( isset( labus_achievement_groups()[ $group ] ) ) {
		update_post_meta( $post_id, '_labus_achievement_group', $group );
	}
	update_post_meta( $post_id, '_labus_achievement_period', $period );
}
add_action( 'save_post_labus_achievement', 'labus_save_achievement_fields' );

/**
 * Importuje rekordy początkowe przy pierwszym uprawnionym żądaniu.
 *
 * Ponowna próba po błędzie pomija wpisy, które już zostały zapisane.
 */
function labus_seed_achievements() {
	if ( get_option( 'labus_achievements_seeded' ) || ! current_user_can( 'publish_posts' ) ||
		! current_user_can( 'edit_others_posts' ) || ! add_option( 'labus_achievements_seeding', '1', '', false ) ) {
		return;
	}

	try {
		$records = require __DIR__ . '/achievements-data.php';
		foreach ( $records as $slug => $record ) {
			if ( get_page_by_path( $slug, OBJECT, array( 'labus_achievement' ) ) ) {
				continue;
			}

			$post_id = wp_insert_post(
				wp_slash(
					array(
						'post_type'    => 'labus_achievement',
						'post_name'    => $slug,
						'post_title'   => $record['title'],
						'post_content' => $record['description'],
						'post_status'  => 'publish',
						'meta_input'   => array(
							'_labus_achievement_group'  => $record['group'],
							'_labus_achievement_period' => $record['period'],
						),
					)
				),
				true
			);
			if ( ! $post_id || is_wp_error( $post_id ) ) {
				return;
			}
		}
		add_option( 'labus_achievements_seeded', '1', '', true );
	} finally {
		delete_option( 'labus_achievements_seeding' );
	}
}
add_action( 'admin_init', 'labus_seed_achievements' );

/**
 * Umożliwia uruchomienie importu po autoryzacji żądania REST.
 *
 * @param mixed $response Bieżąca odpowiedź REST.
 * @return mixed Odpowiedź REST przekazana bez zmian.
 */
function labus_seed_achievements_from_rest( $response ) {
	labus_seed_achievements();
	return $response;
}
add_filter( 'rest_request_before_callbacks', 'labus_seed_achievements_from_rest' );

/**
 * Wyświetla nazwę i okres w wierszu osiągnięcia.
 *
 * @param WP_Post $achievement Wyświetlane osiągnięcie.
 */
function labus_render_achievement_label( $achievement ) {
	?>
	<span class="achievement-title"><?php echo esc_html( get_the_title( $achievement ) ); ?></span>
	<?php $period = get_post_meta( $achievement->ID, '_labus_achievement_period', true ); ?>
	<?php if ( '' !== $period ) : ?>
		<span class="achievement-period"><?php echo esc_html( $period ); ?></span>
	<?php endif; ?>
	<?php
}

/**
 * Wyświetla wiersz z natywnym rozwijaniem, jeśli uzupełniono opis.
 *
 * @param WP_Post $achievement Wyświetlane osiągnięcie.
 * @param string  $group_name  Nazwa grupy rozwijanych wierszy.
 */
function labus_render_achievement( $achievement, $group_name ) {
	$description = trim( $achievement->post_content );
	if ( '' === trim( wp_strip_all_tags( $description ) ) ) {
		?>
		<div class="achievement-row" data-achievement-entry>
			<div class="achievement-label"><?php labus_render_achievement_label( $achievement ); ?></div>
		</div>
		<?php
		return;
	}
	?>
	<details class="achievement-row" data-achievement-entry data-accordion-item name="<?php echo esc_attr( $group_name ); ?>">
		<summary class="achievement-label"><?php labus_render_achievement_label( $achievement ); ?></summary>
		<div data-accordion-panel>
			<div class="achievement-description"><?php echo wp_kses_post( has_blocks( $description ) ? $description : wpautop( $description ) ); ?></div>
		</div>
	</details>
	<?php
}

/**
 * Renderuje opublikowane osiągnięcia z WordPressa wewnątrz sekcji Bricks.
 *
 * @return string Znaczniki listy osiągnięć.
 */
function labus_render_achievements() {
	$groups  = labus_achievement_groups();
	$entries = array_fill_keys( array_keys( $groups ), array() );
	$posts   = get_posts(
		array(
			'post_type'      => 'labus_achievement',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	if ( ! $posts ) {
		return '';
	}
	foreach ( $posts as $achievement ) {
		$group = get_post_meta( $achievement->ID, '_labus_achievement_group', true );
		$entries[ isset( $groups[ $group ] ) ? $group : 'research' ][] = $achievement;
	}

	$instance    = wp_unique_id( 'labus-achievements-' );
	$first_group = true;
	$list_id     = $instance . '-groups';
	ob_start();
	?>
	<div class="achievements" data-component="achievements">
		<div class="achievements-groups" id="<?php echo esc_attr( $list_id ); ?>">
			<?php foreach ( array_filter( $entries ) as $group => $items ) : ?>
				<details class="achievements-group" data-achievement-group="<?php echo esc_attr( $group ); ?>"<?php echo $first_group ? ' open' : ''; ?>>
					<summary class="achievements-group-toggle"><h3><?php echo esc_html( $groups[ $group ] ); ?></h3></summary>
					<h3 class="achievements-group-heading"><?php echo esc_html( $groups[ $group ] ); ?></h3>
					<div data-component="accordion">
						<?php foreach ( $items as $achievement ) : ?>
							<?php labus_render_achievement( $achievement, $instance . '-' . $group ); ?>
						<?php endforeach; ?>
					</div>
				</details>
				<?php $first_group = false; ?>
			<?php endforeach; ?>
		</div>
		<nav class="achievements-pagination" data-achievements-pagination aria-label="<?php esc_attr_e( 'Strony osiągnięć', 'labus' ); ?>" hidden>
			<button type="button" data-achievements-prev aria-controls="<?php echo esc_attr( $list_id ); ?>" aria-label="<?php esc_attr_e( 'Poprzednia strona osiągnięć', 'labus' ); ?>">‹</button>
			<span data-achievements-page aria-live="polite" aria-atomic="true"></span>
			<button type="button" data-achievements-next aria-controls="<?php echo esc_attr( $list_id ); ?>" aria-label="<?php esc_attr_e( 'Następna strona osiągnięć', 'labus' ); ?>">›</button>
		</nav>
	</div>
	<?php
	return ob_get_clean();
}
add_shortcode( 'labus_achievements', 'labus_render_achievements' );
