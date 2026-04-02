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

$BotName = "RoboQC Bot"
$SiteUrl = "https://romeoflexvision.com"
$GithubUrl = "https://github.com/aleksandrlyubarev-blip"
$LinkedInUrl = "https://www.linkedin.com/company/romeoflexvision"
$TelegramUrl = "https://t.me/RomeoFlexVision_bot"
$Products = @(
  @{ name = "RoboQC Inspector"; url = "https://github.com/aleksandrlyubarev-blip/RomeoFlexVision"; description = "Inline quality-control robot and station-level defect capture." },
  @{ name = "Andrew Analytic"; url = "https://github.com/aleksandrlyubarev-blip/Andrew-Analitic"; description = "Station analytics, routing, and root-cause review." },
  @{ name = "Romeo PhD"; url = "https://github.com/aleksandrlyubarev-blip/Romeo_PHD"; description = "Readable reports and technical explanation." },
  @{ name = "Bassito"; url = "https://github.com/aleksandrlyubarev-blip/Bassito"; description = "Training media and pilot enablement." }
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
$BotName is the public entrypoint for the RoboQC landing.

I can:
- explain what RoboQC is
- answer English questions about RoboQC and Romeo FlexVision
- show the live landing and pilot surface
- list the RoboQC product line
- route you to GitHub, LinkedIn, and public contact surfaces
"@
}

function Get-ProductsText {
  $lines = @("RoboQC product line:")
  foreach ($product in $Products) {
    $lines += "- $($product.name): $($product.description)"
    $lines += "  $($product.url)"
  }
  return ($lines -join "`n")
}

function Get-HelpText {
  return @"
Available commands:
/start - open the main navigation
/help - command list and example questions
/about - explain what RoboQC is
/demo - open the live landing
/products - list the RoboQC product line
/github - open GitHub surfaces
/contact - show public contact routes

Ask in English, for example:
- What is RoboQC?
- Why do you focus on station #2 instead of station #5?
- Do I need CAD, cloud, or an ML team?
- How many samples do I need to start?
- What is Romeo FlexVision?
- How fast is inference on the edge?
"@
}

function Normalize-QuestionText {
  param([string]$Text)
  return (($Text.ToLowerInvariant() -replace '[^a-z0-9#]+', ' ') -replace '\s+', ' ').Trim()
}

function Test-AllTerms {
  param(
    [string]$NormalizedText,
    [string[]]$Terms
  )

  foreach ($term in $Terms) {
    if (-not $NormalizedText.Contains($term)) {
      return $false
    }
  }

  return $true
}

function Get-EnglishQuestionReply {
  param([string]$Text)

  $normalized = Normalize-QuestionText -Text $Text
  if (-not $normalized) {
    return $null
  }

  $matchers = @(
    @{
      Terms = @(@("what is", "roboqc"), @("tell me about", "roboqc"), @("what does", "roboqc"), @("roboqc", "quality control"))
      Reply = @"
RoboQC is an AI-powered visual quality-control system for electronics assembly.

It watches the line inline, catches defects the moment they are created, and sends evidence early enough for operators to act before the problem reaches end-of-line test.

Public landing: $SiteUrl
"@
    },
    @{
      Terms = @(@("station 2", "station 5"), @("station #2", "station #5"), @("cost to rework"), @("reactive", "qc"), @("rework", "station 5"), @("missing screw"), @("misaligned connector"))
      Reply = @"
The RoboQC thesis is simple: catch the defect at station #2, not at station #5.

In the deck, a missing screw or misaligned connector is roughly a $10 fix when it is born at station #2, but it can become about $1,000 of rework if it escapes to end-of-line test.

That is why RoboQC is built for inline prevention instead of reactive QA.
"@
    },
    @{
      Terms = @(@("how does", "roboqc"), @("how", "roboqc", "work"), @("inline prevention"), @("edge native"), @("defect detected"), @("camera", "station 2"))
      Reply = @"
RoboQC places vision at the station where the defect is likely to appear, not only at the end of the line.

A camera observes the process, the edge node detects the defect in real time, and the operator gets a frame, trace, and decision while the unit is still recoverable.

The goal is evidence-first action, not a late spreadsheet after the shift is over.
"@
    },
    @{
      Terms = @(@("no cad"), @("need cad"), @("need cloud"), @("no cloud"), @("ml team"), @("need an ml team"), @("on prem"), @("on premise"), @("on prem capability"))
      Reply = @"
RoboQC is designed to remove adoption friction on the factory floor.

The positioning in the materials is: no CAD, no cloud, and no dedicated ML team required for the initial deployment.

It is meant to run on-prem on an edge node so a plant can start with real inspection instead of a long infrastructure program.
"@
    },
    @{
      Terms = @(@("how many", "samples"), @("golden samples"), @("few shot"), @("training samples"), @("how much data"), @("10 30"))
      Reply = @"
The current product story is few-shot deployment rather than giant dataset collection.

The deck points to roughly 10 to 30 golden samples to get started, using the way human inspectors learn what 'good' looks like in the real world.

That is positioned as an alternative to waiting for complex CAD-driven setup.
"@
    },
    @{
      Terms = @(@("latency"), @("inference"), @("200ms"), @("edge node"), @("rtx 3060"), @("rtx 4060"), @("hardware"), @("tensorrt"))
      Reply = @"
The reference deployment in the deck uses an RTX 3060 or 4060 edge node.

With TensorRT and 4-bit quantization, the target is sub-200ms inference, which is the range needed for real inline intervention instead of post-process reporting.
"@
    },
    @{
      Terms = @(@("what is", "romeoflexvision"), @("what is", "romeo flexvision"), @("romeo flexvision"), @("romeoflexvision"), @("open execution layer"), @("physical ai"))
      Reply = @"
Romeo FlexVision is the open execution layer behind RoboQC.

Its role is to bridge perception, reasoning, and physical action across heterogeneous industrial hardware, without locking the plant into a closed vendor stack.

In the materials, it is positioned as the neutral bridge for physical AI: import, annotate, train, deploy, and then trigger real action on the floor.
"@
    },
    @{
      Terms = @(@("semantic conflict"), @("action layer"), @("plc"), @("webhook"), @("physical move"), @("conflict resolution"))
      Reply = @"
The action layer is about turning perception into a safe physical decision.

In the RoboQC deck, semantic conflict resolution combines inputs from different nodes, resolves the final verdict, and then triggers the PLC or downstream control path.

The point is that execution is not just a webhook. It is the verdict that causes the physical move.
"@
    },
    @{
      Terms = @(@("open source"), @("vendor lock"), @("lock in"), @("multi vendor"), @("neutral switzerland"), @("moat"), @("walled gardens"))
      Reply = @"
Romeo FlexVision is positioned around an open-source core and multi-vendor coordination.

The strategic argument is that factories do not want a black-box controller sitting in front of a multi-million-dollar line.

By keeping the core open and hardware-neutral, the platform aims to reduce vendor lock-in and become the trusted routing layer between vision, PLCs, robotic arms, and third-party AMRs.
"@
    },
    @{
      Terms = @(@("pilot"), @("q2 pilot"), @("use cases"), @("industries"), @("ems"), @("data center"), @("telecom"), @("automotive electronics"), @("server racks"))
      Reply = @"
The near-term wedge is electronics manufacturing and data-center hardware, especially dense server-rack assembly where one cable or component mistake is expensive.

From there, the deck expands to telecom equipment and later to automotive electronics and industrial systems.

The pilot narrative is grounded in real-world inspection of physical server racks, not abstract lab demos.
"@
    },
    @{
      Terms = @(@("product line"), @("what products"), @("which products"), @("products"), @("repos"))
      Reply = Get-ProductsText
    }
  )

  foreach ($matcher in $matchers) {
    foreach ($termGroup in $matcher.Terms) {
      if (Test-AllTerms -NormalizedText $normalized -Terms $termGroup) {
        return $matcher.Reply
      }
    }
  }

  return $null
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
      Send-Message -ChatId $ChatId -Text "Hello. I am $BotName.`n`nUse me to open the RoboQC landing, inspect products, and ask English questions about RoboQC and Romeo FlexVision.`n`nExample: Why do you focus on station #2 instead of station #5?" -ReplyMarkup (Build-MainKeyboard)
      return
    }
    '^/help(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text (Get-HelpText)
      return
    }
    '^/about(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text (Get-AboutText) -ReplyMarkup (Build-MainKeyboard)
      return
    }
    '^/demo(@\w+)?$' {
      Send-Message -ChatId $ChatId -Text "Live landing: $SiteUrl" -ReplyMarkup (Build-MainKeyboard)
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
    Send-Message -ChatId $ChatId -Text "Hello. I am $BotName. Ask me in English about RoboQC or use /about." -ReplyMarkup (Build-MainKeyboard)
    return
  }

  if (Is-SelfQuestion -Text $trimmed) {
    Send-Message -ChatId $ChatId -Text (Get-AboutText) -ReplyMarkup (Build-MainKeyboard)
    return
  }

  $knowledgeReply = Get-EnglishQuestionReply -Text $trimmed
  if ($knowledgeReply) {
    Send-Message -ChatId $ChatId -Text $knowledgeReply -ReplyMarkup (Build-MainKeyboard)
    return
  }

  Send-Message -ChatId $ChatId -Text "I am $BotName. Ask me in English about RoboQC, Romeo FlexVision, station #2, edge deployment, few-shot samples, or use /about /help /demo /products /github /contact." -ReplyMarkup (Build-MainKeyboard)
}

Invoke-TelegramMethod -Method "deleteWebhook" -Body @{} | Out-Null
Invoke-TelegramMethod -Method "setMyCommands" -Body @{
  commands = @(
    @{ command = "start"; description = "Open the main navigation" },
    @{ command = "about"; description = "Explain what RoboQC is" },
    @{ command = "help"; description = "Show available commands" },
    @{ command = "demo"; description = "Open the live landing" },
    @{ command = "products"; description = "List RoboQC products" },
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
