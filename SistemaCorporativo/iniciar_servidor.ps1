$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "--- SCI ERP: Servidor Local Iniciado ---" -ForegroundColor Cyan
    Write-Host "Accede en: http://localhost:$port" -ForegroundColor White
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow

    while($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath.TrimStart('/')
        if ($path -eq "") { $path = "index.html" }
        $fullPath = Join-Path $pwd $path
        
        if (Test-Path $fullPath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($fullPath)
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = switch($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $mime
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    Write-Host "`n[ERROR DICTADO POR WINDOWS]:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host "`nEs probable que Windows bloquee el script por seguridad o puerto ocupado." -ForegroundColor Gray
} finally {
    if ($listener) { $listener.Stop() }
    Write-Host "`n--- Presiona ENTER para cerrar esta ventana ---" -ForegroundColor DarkGray
    Read-Host
}
