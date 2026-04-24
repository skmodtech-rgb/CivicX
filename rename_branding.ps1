Get-ChildItem -Recurse -File -Include *.js,*.jsx,*.json,*.html,*.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'CivicX AI', 'CivicX'
    if ($content -ne $newContent) {
        $newContent | Set-Content $_.FullName
        Write-Host "Updated: $($_.FullName)"
    }
}
