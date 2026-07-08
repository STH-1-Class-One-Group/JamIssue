param(
    [string]$ProjectName = $(if($env:CLOUDFLARE_PAGES_PROJECT_NAME){$env:CLOUDFLARE_PAGES_PROJECT_NAME}else{'daejeon-jamissue-pages'}),
    [string]$Branch = 'preview-local'
)

if (-not $Branch.StartsWith('preview-')) {
    throw 'This public repository deploy script only allows preview-* Cloudflare Pages branches.'
}

Push-Location (Resolve-Path "$PSScriptRoot\..")
try {
    npm.cmd run build
    npx wrangler pages deploy infra/nginx/site --project-name $ProjectName --branch $Branch --config deploy/wrangler.pages.toml
}
finally {
    Pop-Location
}
