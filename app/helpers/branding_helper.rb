# frozen_string_literal: true

module BrandingHelper
  def logo_as_symbol(version = :icon)
    case version
    when :icon
      _logo_as_symbol_icon
    when :wordmark
      _logo_as_symbol_wordmark
    end
  end

  def _logo_as_symbol_wordmark
    image_tag(frontend_asset_path('images/kronk-wordmark.png'), alt: 'Kronk', class: 'logo logo--wordmark', style: 'height: 50px; width: auto;')
  end

  def _logo_as_symbol_icon
    content_tag(:svg, tag.use(href: '#logo-symbol-icon'), viewBox: '0 0 79 79', class: 'logo logo--icon')
  end

  def render_logo
    image_tag(frontend_asset_path('images/logo.svg'), alt: 'Kronk', class: 'logo logo--icon')
  end
end
