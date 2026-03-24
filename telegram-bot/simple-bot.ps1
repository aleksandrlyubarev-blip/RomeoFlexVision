param(
  [string]$Token,
  [string]$StateDir = ".runtime"
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
  param(
    [string]$Name
  )

  $envValue = [Environment]::GetEnvironmentVariable($Name)
  if ($envValue) {
    return $envValue
  }

  $envPath = Join-Path $PSScriptRoot ".env"
  if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
      if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
        continue
      }
      $parts = $line -split "=", 2
      if ($parts.Length -eq 2 -and $parts[0].Trim() -eq $Name) {
        return $parts[1].Trim()
      }
    }
  }

  return $null
}

if (-not $Token) {
  $Token = Get-EnvValue -Name "TELEGRAM_BOT_TOKEN"
}

if (-not $Token) {
  throw "TELEGRAM_BOT_TOKEN is required"
}

$BotName = "RomeoFlexVision Bot"
$SiteUrl = "https://romeoflexvision.com"
$GithubUrl = "https://github.com/aleksandrlyubarev-blip"
$LinkedInUrl = "https://www.linkedin.com/company/romeoflexvision"
$TelegramUrl = "https://t.me/RomeoFlexVision_bot"
$Products = @(
  @{ name = "Andrew Swarm"; url = "https://github.com/aleksandrlyubarev-blip/Andrew-Analitic"; description = "Data science orchestration and routing." },
  @{ name = "Romeo PhD"; url = "https://github.com/aleksandrlyubarev-blip/Romeo_PHD"; description = "Educational AI companion." },
  @{ name = "Bassito"; url = "https://github.com/aleksandrlyubarev-blip/Bassito"; description = "Automated video production pipeline." },
  @{ name = "PinoCut"; url = "https://github.com/aleksandrlyubarev-blip/Pino_cut"; description = "Scene assembly and rough-cut tooling." }
)

$StatePath = Join-Path $PSScriptRoot $StateDir
New-Item -ItemType Directory -Force -Path $StatePath | Out-Null
$OffsetFile = Join-Path $StatePath "offset.txt"
$LogFile = Join-Path $StatePath "simple-bot.log"

function New-UnicodeString {
  param([int[]]$CodePoints)
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}

$GreetingRuPrivet = New-UnicodeString @(0x043F, 0x0440, 0x0438, 0x0432, 0x0435, 0x0442)
$GreetingRuHello1 = New-UnicodeString @(0x0437, 0x0434, 0x0440, 0x0430, 0x0432, 0x0441, 0x0442, 0x0432, 0x0443, 0x0439)
$GreetingRuHello2 = New-UnicodeString @(0x0437, 0x0434, 0x0440, 0x0430, 0x0432, 0x0441, 0x0442, 0x0432, 0x0443, 0x0439, 0x0442, 0x0435)
$GreetingHeShalom = New-UnicodeString @(0x05E9, 0x05DC, 0x05D5, 0x05DD)
$AskRuWho = New-UnicodeString @(0x043A, 0x0442, 0x043E, 0x0020, 0x0442, 0x044B)
$AskRuWhat = New-UnicodeString @(0x0447, 0x0442, 0x043E, 0x0020, 0x0442, 0x044B)
$AskRuCan = New-UnicodeString @(0x0447, 0x0442, 0x043E, 0x0020, 0x0442, 0x044B, 0x0020, 0x0443, 0x043C, 0x0435, 0x0435, 0x0448, 0x044C)
$AskRuAbout = New-UnicodeString @(0x0440, 0x0430, 0x0441, 0x0441, 0x043A, 0x0430, 0x0436, 0x0438, 0x0020, 0x043E, 0x0020, 0x0441, 0x0435, 0x0431, 0x0435)
$AskHeWho = New-UnicodeString @(0x05DE, 0x05D9, 0x0020, 0x05D0, 0x05EA, 0x05D4)
$AskHeWhat = New-UnicodeString @(0x05DE, 0x05D4, 0x0020, 0x05D0, 0x05EA, 0x05D4)
$AskHeAbout = New-UnicodeString @(0x05E1, 0x05E4, 0x05E8, 0x0020, 0x05E2, 0x05DC, 0x0020, 0x05E2, 0x05E6, 0x05DE, 0x05DA)
$AskHeDo = New-UnicodeString @(0x05DE, 0x05D4, 0x0020, 0x05D0, 0x05EA, 0x05D4, 0x0020, 0x05E2, 0x05D5, 0x05E9, 0x05D4)

function Write-Log {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $LogFile -Value "[$timestamp] $Message"
}

function Get-Offset {
  if (Test-Path $OffsetFile) {
    return [int64](Get-Content $OffsetFile -Raw)
  }
  return 0
}

function Set-Offset {
  param([int64]$Value)
  Set-Content -Path $OffsetFile -Value $Value
}

function Invoke-TelegramMethod {
  param(
    [string]$Method,
    [hashtable]$Body = @{}
  )

  $uri = "https://api.telegram.org/bot$Token/$Method"
  return Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10 -Compress)
}

function Send-Message {
  param(
    [int64]$ChatId,
    [string]$Text,
    [object]$ReplyMarkup = $null
  )

  $body = @{
    chat_id = $ChatId
    text = $Text
  }

  if ($ReplyMarkup) {
    $body.reply_markup = $ReplyMarkup
  }

  Invoke-TelegramMethod -Method "sendMessage" -Body $body | Out-Null
}

function Build-MainKeyboard {
  return @{
    inline_keyboard = @(
      @(
        @{ text = "Open site"; url = $SiteUrl },
        @{ text = "GitHub"; url = $GithubUrl }
      ),
      @(
        @{ text = "LinkedIn"; url = $LinkedInUrl },
        @{ text = "Telegram"; url = $TelegramUrl }
      )
    )
  }
}

function Get-AboutText {
  return @"
$BotName is the public entrypoint for the RomeoFlexVision ecosystem.

I can:
- explain what RomeoFlexVision is
- show the live site and demo
- list the ecosystem products
- route you to GitHub, LinkedIn, and public contact surfaces
"@
}

function Get-ProductsText {
  $lines = @("RomeoFlexVision products:")
  foreach ($product in $Products) {
    $lines += "- $($product.name): $($product.description)"
    $lines += "  $($product.url)"
  }
  return ($lines -join "`n")
}

function Is-Greeting {
  param([string]$Text)
  $normalized = $Text.Trim().ToLowerInvariant()
  $triggers = @("hi", "hello", "hey", $GreetingRuPrivet, $GreetingRuHello1, $GreetingRuHello2, "shalom", $GreetingHeShalom)
  return $triggers -contains $normalized
}

function Is-SelfQuestion {
  param([string]$Text)
  $normalized = $Text.Trim().ToLowerInvariant()
  $triggers = @(
    "who are you",
    "what are you",
    "what do you do",
    "about you",
    "tell me about yourself",
    $AskRuWho,
    $AskRuWhat,
    $AskRuCan,
    $AskRuAbout,
    $AskHeWho,
    $AskHeWhat,
    $AskHeAbout,
    $AskHeDo
  )

  foreach ($trigger in $triggers) {
    if ($normalized.Contains($trigger)) {
      return $true
    }
  }

  return $false
}

function Handle-TextMessage {
  param(
    [int64]$ChatId,
    [string]$Text
  )

  $trimmed = $Text.Trim()

  switch -Regex ($trimmed) {
    '^/start(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "Hello. I am $BotName.`n`nUse me to open the site, inspect products, and ask what I do." -ReplyMarkup (Build-MainKeyboard)
      return
    }
    '^/help(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "/start`n/about`n/demo`n/products`n/github`n/contact"
      return
    }
    '^/about(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text (Get-AboutText) -ReplyMarkup (Build-MainKeyboard)
      return
    }
    '^/demo(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "Live site: $SiteUrl" -ReplyMarkup (Build-MainKeyboard)
      return
    }
    '^/products(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text (Get-ProductsText)
      return
    }
    '^/github(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "GitHub org: $GithubUrl"
      return
    }
    '^/contact(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "Contact surfaces:`n- Telegram: @RomeoFlexVision_bot`n- LinkedIn: $LinkedInUrl`n- Website: $SiteUrl"
      return
    }
  }

  if (Is-Greeting -Text $trimmed) {
    Send-Message -ChatId $ChatId -Text "Hello. I am $BotName. Ask me what I do or use /about." -ReplyMarkup (Build-MainKeyboard)
    return
  }

  if (Is-SelfQuestion -Text $trimmed) {
    Send-Message -ChatId $ChatId -Text (Get-AboutText) -ReplyMarkup (Build-MainKeyboard)
    return
  }

  Send-Message -ChatId $ChatId -Text "I am $BotName. Ask me who I am, what I do, or use /about /demo /products /github /contact."
}

Invoke-TelegramMethod -Method "deleteWebhook" -Body @{} | Out-Null
Invoke-TelegramMethod -Method "setMyCommands" -Body @{
  commands = @(
    @{ command = "start"; description = "Open the main navigation" },
    @{ command = "about"; description = "Explain what this bot does" },
    @{ command = "help"; description = "Show available commands" },
    @{ command = "demo"; description = "Open the live demo" },
    @{ command = "products"; description = "List ecosystem products" },
    @{ command = "github"; description = "Open GitHub surfaces" },
    @{ command = "contact"; description = "Show public contact routes" }
  )
} | Out-Null

Write-Log "simple polling bot started"
$offset = Get-Offset

while ($true) {
  try {
    $updates = Invoke-TelegramMethod -Method "getUpdates" -Body @{
      offset = $offset
      timeout = 25
      allowed_updates = @("message")
    }

    if ($updates.ok -and $updates.result) {
      foreach ($update in $updates.result) {
        $nextOffset = [int64]$update.update_id + 1
        if ($nextOffset -gt $offset) {
          $offset = $nextOffset
          Set-Offset -Value $offset
        }

        if ($update.message -and $update.message.text) {
          $chatId = [int64]$update.message.chat.id
          $text = [string]$update.message.text
          Write-Log "message received: $text"
          Handle-TextMessage -ChatId $chatId -Text $text
        }
      }
    }
  } catch {
    Write-Log "error: $($_.Exception.Message)"
    Start-Sleep -Seconds 5
  }
}
