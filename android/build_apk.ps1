# Construit l'APK "Cible Photo" (WebView) sans Gradle.
# Sortie : android\out\CiblePhoto.apk (signe avec la cle debug)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$sdk   = "$env:LOCALAPPDATA\Android\Sdk"
$bt    = Get-ChildItem "$sdk\build-tools" | Sort-Object { [version]$_.Name } | Select-Object -Last 1
$bt    = $bt.FullName
$jar   = "$sdk\platforms\android-34\android.jar"
$out   = "out"

Remove-Item -Recurse -Force $out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$out\assets", "$out\classes", "$out\dex" | Out-Null
Copy-Item "..\index.html", "..\icon-192.png" "$out\assets\"

# 1. Ressources
& "$bt\aapt2.exe" compile --dir res -o "$out\res.zip"
if ($LASTEXITCODE) { throw "aapt2 compile" }
& "$bt\aapt2.exe" link -o "$out\base.apk" -I $jar --manifest AndroidManifest.xml -A "$out\assets" "$out\res.zip" --auto-add-overlay
if ($LASTEXITCODE) { throw "aapt2 link" }

# 2. Java -> dex
& javac -Xlint:-options --release 8 -classpath $jar -d "$out\classes" (Get-ChildItem -Recurse src -Filter *.java).FullName
if ($LASTEXITCODE) { throw "javac" }
$classes = (Get-ChildItem -Recurse "$out\classes" -Filter *.class).FullName
& java -cp "$bt\lib\d8.jar" com.android.tools.r8.D8 --min-api 24 --lib $jar --output "$out\dex" $classes
if ($LASTEXITCODE) { throw "d8" }

# 3. Ajout du dex, alignement, signature
Push-Location "$out\dex"
& jar uf "..\base.apk" classes.dex
Pop-Location
if ($LASTEXITCODE) { throw "jar" }
& "$bt\zipalign.exe" -f -p 4 "$out\base.apk" "$out\aligned.apk"
if ($LASTEXITCODE) { throw "zipalign" }
$ks = "$env:USERPROFILE\.android\debug.keystore"
if (-not (Test-Path $ks)) {
    # Pas encore de cle debug sur cet ordinateur : on cree la cle standard d'Android.
    New-Item -ItemType Directory -Force (Split-Path $ks) | Out-Null
    & keytool -genkeypair -keystore $ks -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
    if ($LASTEXITCODE) { throw "keytool" }
}
& "$bt\apksigner.bat" sign --ks $ks --ks-pass pass:android --key-pass pass:android --out "$out\CiblePhoto.apk" "$out\aligned.apk"
if ($LASTEXITCODE) { throw "apksigner" }

Write-Host "APK pret : $PSScriptRoot\$out\CiblePhoto.apk" -ForegroundColor Green
