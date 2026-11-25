<?php
/**
 * Konfiguracja motywu potomnego.
 *
 * @package Labus
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/achievements.php';
require_once __DIR__ . '/appearances.php';

/**
 * Rejestruje miejsce na tłumaczenia motywu.
 */
function labus_setup() {
	load_child_theme_textdomain( 'labus', get_stylesheet_directory() . '/languages' );
}
add_action( 'after_setup_theme', 'labus_setup' );
