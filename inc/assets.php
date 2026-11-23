<?php
/**
 * Rejestracja plików z buildu Vite.
 *
 * @package Labus
 */

defined( 'ABSPATH' ) || exit;

/**
 * Ładuje style na froncie i w canvasie, a moduł JS tylko na froncie.
 */
function labus_enqueue_assets() {
	if ( function_exists( 'bricks_is_builder_main' ) && bricks_is_builder_main() ) {
		return;
	}

	$theme_uri   = get_stylesheet_directory_uri();
	$style       = 'dist/main.css';
	$css_version = labus_asset_version( $style );

	if ( false !== $css_version ) {
		wp_enqueue_style( 'labus-dystopian', 'https://use.typekit.net/boc5clz.css', array(), $css_version );
		wp_enqueue_style( 'labus-frontend', $theme_uri . '/' . $style, array( 'bricks-frontend', 'labus-dystopian' ), $css_version );
	}

	if ( function_exists( 'bricks_is_builder_iframe' ) && bricks_is_builder_iframe() ) {
		return;
	}

	$script     = 'dist/main.js';
	$js_version = labus_asset_version( $script );

	if ( false !== $js_version ) {
		wp_enqueue_script_module( '@labus/main', $theme_uri . '/' . $script, array(), $js_version );
	}
}
add_action( 'wp_enqueue_scripts', 'labus_enqueue_assets', 20 );
