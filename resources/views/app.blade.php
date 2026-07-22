<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#071b33">
    <meta name="description" content="{{ $description }}">
    <link rel="canonical" href="{{ request()->url() }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ request()->url() }}">
    <meta property="og:image" content="{{ $image }}">
    <meta name="twitter:card" content="summary_large_image">
    @if(!empty($favicon))
        <link rel="icon" href="{{ $favicon }}" type="image/png">
        <link rel="shortcut icon" href="{{ $favicon }}">
        <link rel="apple-touch-icon" href="{{ $favicon }}">
    @endif
    <title>{{ $title }}</title>
    <script type="application/ld+json">@json($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)</script>
    @if(!empty($analyticsId))
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $analyticsId }}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.__nexifyGaId = @json($analyticsId);
            gtag('js', new Date());
            gtag('config', @json($analyticsId), { send_page_view: false });
        </script>
    @endif
    @if(!empty($headerScripts))
        {!! $headerScripts !!}
    @endif
    @vite(['resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
    <noscript>You need JavaScript enabled to use Nexify.</noscript>
    @if(!empty($footerScripts))
        {!! $footerScripts !!}
    @endif
</body>
</html>
