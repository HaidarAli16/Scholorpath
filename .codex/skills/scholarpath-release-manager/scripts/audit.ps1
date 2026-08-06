param(
  [string]$Repo = (Get-Location).Path,
  [switch]$Remote
)

$ErrorActionPreference = "Stop"
$requiredEnv = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "ALLOWED_APP_ORIGINS"
)

Push-Location $Repo
try {
  if (-not (Test-Path (Join-Path $Repo "SCHOLARPATH_BETA_MODULE_TRACKER.md"))) {
    throw "The selected repository does not contain SCHOLARPATH_BETA_MODULE_TRACKER.md."
  }

  $envFile = Join-Path $Repo ".env.local"
  $presentEnv = @()
  if (Test-Path $envFile) {
    $names = Get-Content $envFile |
      Where-Object { $_ -match '^\s*[A-Z0-9_]+\s*=' } |
      ForEach-Object { ($_ -split '=', 2)[0].Trim() }
    $presentEnv = $requiredEnv | Where-Object { $_ -in $names }
  }

  $result = [ordered]@{
    checked_at = (Get-Date).ToString("o")
    branch = (git branch --show-current).Trim()
    worktree_clean = -not [bool](git status --porcelain)
    tracking = (git status -sb | Select-Object -First 1).Trim()
    latest_commit = (git log -1 --format="%h %s").Trim()
    api_routes = @(Get-ChildItem "src\app\api" -Recurse -Filter "route.ts").Count
    test_files = @(Get-ChildItem "src" -Recurse -Include "*.test.ts", "*.test.tsx").Count
    migrations = @(Get-ChildItem "supabase\migrations" -Filter "*.sql").Count
    latest_migration = (Get-ChildItem "supabase\migrations" -Filter "*.sql" | Sort-Object Name | Select-Object -Last 1).Name
    env_local_exists = Test-Path $envFile
    required_env_names_present = $presentEnv
    required_env_names_missing = @($requiredEnv | Where-Object { $_ -notin $presentEnv })
    vercel_linked = Test-Path (Join-Path $Repo ".vercel\project.json")
    database_deploy_workflow = Test-Path (Join-Path $Repo ".github\workflows\deploy-database.yml")
  }

  if ($Remote) {
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if ($gh) {
      $runJson = gh run list --branch main --limit 1 --json status,conclusion,headSha,createdAt,url --jq '.[0]'
      $secretNames = @(gh secret list --json name --jq '.[].name')
      $result.github_latest_main_run = ConvertFrom-Json -InputObject $runJson
      $result.github_repository_secrets = @($secretNames | Where-Object { $_ })
      $result.github_deployment_count = [int](gh api repos/HaidarAli16/Scholorpath/deployments --jq 'length')
    }
  }

  [pscustomobject]$result | ConvertTo-Json -Depth 6
}
finally {
  Pop-Location
}
