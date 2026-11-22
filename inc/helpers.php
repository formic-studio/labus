<?php
/**
 * Funkcje pomocnicze motywu.
 *
 * @package Labus
 */

defined( 'ABSPATH' ) || exit;

/**
 * Zwraca wersję istniejącego pliku assetu motywu potomnego.
 *
 * @param string $relative_path Ścieżka względem katalogu motywu potomnego.
 * @return string|false Znacznik modyfikacji lub false, gdy pliku nie można odczytać.
 */
function labus_asset_version( $relative_path ) {
	$path = get_stylesheet_directory() . '/' . $relative_path;

	if ( ! is_file( $path ) || ! is_readable( $path ) ) {
		return false;
	}

	$modified_at = filemtime( $path );

	return false === $modified_at ? false : (string) $modified_at;
}
