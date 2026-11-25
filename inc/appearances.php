<?php
/**
 * Wystąpienia i publikacje na stronie „O mnie”.
 *
 * @package Labus
 */

defined( 'ABSPATH' ) || exit;

/**
 * Rejestruje wpisy z listy wystąpień i publikacji.
 */
function labus_register_appearances() {
	register_post_type(
		'labus_appearance',
		array(
			'labels'       => array(
				'name'          => __( 'Wystąpienia i publikacje', 'labus' ),
				'singular_name' => __( 'Wystąpienie lub publikacja', 'labus' ),
				'add_new'       => __( 'Dodaj wpis', 'labus' ),
				'add_new_item'  => __( 'Dodaj wystąpienie lub publikację', 'labus' ),
				'edit_item'     => __( 'Edytuj wystąpienie lub publikację', 'labus' ),
				'all_items'     => __( 'Wszystkie wpisy', 'labus' ),
			),
			'public'       => false,
			'show_ui'      => true,
			'show_in_rest' => true,
			'map_meta_cap' => true,
			'menu_icon'    => 'dashicons-megaphone',
			'rewrite'      => false,
			'supports'     => array( 'title', 'revisions' ),
		)
	);
}
add_action( 'init', 'labus_register_appearances' );

/**
 * Dodaje pola źródła i adresu URL do ekranu edycji.
 */
function labus_add_appearance_fields() {
	add_meta_box( 'labus-appearance-fields', __( 'Źródło i link', 'labus' ), 'labus_render_appearance_fields', 'labus_appearance', 'normal' );
}
add_action( 'add_meta_boxes_labus_appearance', 'labus_add_appearance_fields' );

/**
 * Wyświetla pola źródła i adresu zewnętrznego.
 *
 * @param WP_Post $post Edytowany wpis.
 */
function labus_render_appearance_fields( $post ) {
	$source = get_post_meta( $post->ID, '_labus_appearance_source', true );
	$url    = get_post_meta( $post->ID, '_labus_appearance_url', true );
	wp_nonce_field( 'labus_save_appearance', 'labus_appearance_nonce' );
	?>
	<p>
		<label for="labus-appearance-source"><?php esc_html_e( 'Źródło', 'labus' ); ?></label><br>
		<input id="labus-appearance-source" name="labus_appearance_source" type="text" class="widefat" value="<?php echo esc_attr( $source ); ?>">
	</p>
	<p>
		<label for="labus-appearance-url"><?php esc_html_e( 'Adres URL materiału', 'labus' ); ?></label><br>
		<input id="labus-appearance-url" name="labus_appearance_url" type="url" class="widefat" value="<?php echo esc_attr( $url ); ?>" placeholder="https://" aria-describedby="labus-appearance-url-description">
		<span id="labus-appearance-url-description" class="description"><?php esc_html_e( 'Po dodaniu adresu cały wiersz otworzy materiał w nowej karcie.', 'labus' ); ?></span>
	</p>
	<?php
}

/**
 * Zwraca bezwzględny adres HTTP lub HTTPS.
 *
 * @param string $value Wpisany adres materiału.
 * @return string
 */
function labus_sanitize_appearance_url( $value ) {
	$parts = wp_parse_url( trim( $value ) );
	if ( empty( $parts['host'] ) || empty( $parts['scheme'] ) || isset( $parts['user'] ) ||
		! in_array( strtolower( $parts['scheme'] ), array( 'https', 'http' ), true ) ) {
		return '';
	}
	return esc_url_raw( $value, array( 'https', 'http' ) );
}

/**
 * Zapisuje pola po uprawnionej edycji w panelu WordPressa.
 *
 * @param int $post_id Identyfikator wpisu.
 */
function labus_save_appearance_fields( $post_id ) {
	if ( ! isset( $_POST['labus_appearance_nonce'], $_POST['labus_appearance_source'], $_POST['labus_appearance_url'] ) ||
		! is_string( $_POST['labus_appearance_url'] ) ||
		! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['labus_appearance_nonce'] ) ), 'labus_save_appearance' ) ||
		! current_user_can( 'edit_post', $post_id ) || wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}

	$source = sanitize_text_field( wp_unslash( $_POST['labus_appearance_source'] ) );
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Własna walidacja bezwzględnego URL korzysta z esc_url_raw().
	$url = labus_sanitize_appearance_url( wp_unslash( $_POST['labus_appearance_url'] ) );
	update_post_meta( $post_id, '_labus_appearance_source', $source );
	update_post_meta( $post_id, '_labus_appearance_url', $url );
}
add_action( 'save_post_labus_appearance', 'labus_save_appearance_fields' );

/**
 * Dodaje początkowe wpisy, zachowując już zapisane edycje.
 */
function labus_seed_appearances() {
	if ( get_option( 'labus_appearances_seeded' ) || ! current_user_can( 'publish_posts' ) ||
		! current_user_can( 'edit_others_posts' ) || ! add_option( 'labus_appearances_seeding', '1', '', false ) ) {
		return;
	}

	try {
		$records = require __DIR__ . '/appearances-data.php';
		foreach ( $records as $slug => $record ) {
			if ( get_page_by_path( $slug, OBJECT, array( 'labus_appearance' ) ) ) {
				continue;
			}

			$post_id = wp_insert_post(
				wp_slash(
					array(
						'post_type'   => 'labus_appearance',
						'post_name'   => $slug,
						'post_title'  => $record['title'],
						'post_status' => 'publish',
						'meta_input'  => array(
							'_labus_appearance_source' => $record['source'],
							'_labus_appearance_url'    => $record['url'],
						),
					)
				),
				true
			);
			if ( ! $post_id || is_wp_error( $post_id ) ) {
				return;
			}
		}
		add_option( 'labus_appearances_seeded', '1', '', true );
	} finally {
		delete_option( 'labus_appearances_seeding' );
	}
}
add_action( 'admin_init', 'labus_seed_appearances' );

/**
 * Uruchamia import także po autoryzacji żądania REST.
 *
 * @param mixed $response Bieżąca odpowiedź REST.
 * @return mixed
 */
function labus_seed_appearances_from_rest( $response ) {
	labus_seed_appearances();
	return $response;
}
add_filter( 'rest_request_before_callbacks', 'labus_seed_appearances_from_rest' );

/**
 * Wyświetla tytuł i źródło jednego materiału.
 *
 * @param WP_Post $post Wystąpienie lub publikacja.
 * @param bool    $linked Czy wiersz zawiera odnośnik.
 */
function labus_render_appearance_label( $post, $linked ) {
	$source = get_post_meta( $post->ID, '_labus_appearance_source', true );
	?>
	<span class="appearance-title">
		<?php echo esc_html( get_the_title( $post ) ); ?>
		<?php if ( $linked ) : ?>
			<span class="screen-reader-only"><?php esc_html_e( '(otwiera się w nowej karcie)', 'labus' ); ?></span>
		<?php endif; ?>
	</span>
	<span class="appearance-source"><?php echo esc_html( $source ); ?></span>
	<?php
}

/**
 * Renderuje listę opublikowanych materiałów wewnątrz sekcji Bricks.
 *
 * @return string HTML listy.
 */
function labus_render_appearances() {
	$posts = get_posts(
		array(
			'post_type'      => 'labus_appearance',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => 'ID',
			'order'          => 'ASC',
		)
	);
	if ( ! $posts ) {
		return '';
	}

	ob_start();
	?>
	<ul class="appearances" role="list">
		<?php foreach ( $posts as $appearance ) : ?>
			<?php $url = labus_sanitize_appearance_url( get_post_meta( $appearance->ID, '_labus_appearance_url', true ) ); ?>
			<li>
				<?php if ( $url ) : ?>
					<a class="appearance-row" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer">
						<?php labus_render_appearance_label( $appearance, true ); ?>
					</a>
				<?php else : ?>
					<div class="appearance-row"><?php labus_render_appearance_label( $appearance, false ); ?></div>
				<?php endif; ?>
			</li>
		<?php endforeach; ?>
	</ul>
	<?php
	return ob_get_clean();
}
add_shortcode( 'labus_appearances', 'labus_render_appearances' );
