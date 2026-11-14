; Nobs SimTools — Windows installer (NSIS 3, Unicode, per-user, no admin rights).
;
; Copies the Community-folder package into the MSFS 2024 Community folder, found by
; reading InstalledPackagesPath from UserCfg.opt (Steam and Microsoft Store installs),
; and registers an uninstaller under Settings → Apps.
;
; Build it with `pnpm installer` (scripts/build-installer.ts), which passes:
;   /DVERSION=x.y.z[-pre]  /DVERSION_NUMERIC=x.y.z
;   /DPACKAGE_DIR=<repo>\dist\nobs-fs-simtools  /DOUT_FILE=<setup.exe>
; VERSION_NUMERIC is VERSION without a prerelease suffix: the Windows file version
; (VIProductVersion) must be four plain numbers.
;
; Branding (icon, header and sidebar bitmaps) matches the Nobs FS app installer;
; regenerate the bitmaps with `pnpm installer:images`.

Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma

!ifndef VERSION
  !error "Pass /DVERSION=x.y.z — build with `pnpm installer`."
!endif
!ifndef VERSION_NUMERIC
  !define VERSION_NUMERIC "${VERSION}"
!endif
!ifndef PACKAGE_DIR
  !error "Pass /DPACKAGE_DIR=<path to dist\nobs-fs-simtools> — build with `pnpm installer`."
!endif
!ifndef OUT_FILE
  !define OUT_FILE "nobs-fs-simtools_${VERSION}_setup.exe"
!endif

!define PRODUCT_NAME "Nobs SimTools"
!define PUBLISHER "Nobs FS"
!define PACKAGE_NAME "nobs-fs-simtools"
!define SIM_EXE "FlightSimulator2024.exe"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\NobsFSSimTools"
!define SETTINGS_KEY "Software\Nobs FS SimTools"
; The uninstaller lives outside the Community folder, so MSFS never sees it. Its folder
; and registry key are deliberately NOT under "Nobs FS": that is the Nobs FS desktop
; app's own install folder (%LOCALAPPDATA%\Nobs FS), which its uninstaller may delete.
!define TOOLS_DIR "$LOCALAPPDATA\Nobs FS SimTools"

Name "${PRODUCT_NAME}"
OutFile "${OUT_FILE}"
RequestExecutionLevel user
InstallDir ""
BrandingText "${PRODUCT_NAME} ${VERSION}"

VIProductVersion "${VERSION_NUMERIC}.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "${PUBLISHER}"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"

Var DetectedFrom

; ── Look & feel (same assets as the Nobs FS app installer) ─────────────────────
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "assets\header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP "assets\header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "assets\sidebar.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "assets\sidebar.bmp"
!define MUI_ABORTWARNING

; ── Pages ──────────────────────────────────────────────────────────────────────
!define MUI_WELCOMEPAGE_TITLE "Install ${PRODUCT_NAME} ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "This installs the Nobs SimTools toolbar panel for Microsoft Flight Simulator 2024.$\r$\n$\r$\nIt works in VR and on a monitor. During a flight, open it from the toolbar at the top of the screen.$\r$\n$\r$\nPlease close MSFS 2024 before you continue."
!insertmacro MUI_PAGE_WELCOME

!define MUI_PAGE_HEADER_TEXT "MSFS 2024 Community folder"
!define MUI_PAGE_HEADER_SUBTEXT "Choose where the SimTools add-on is installed."
!define MUI_DIRECTORYPAGE_TEXT_TOP "$DetectedFrom$\r$\n$\r$\nSimTools is installed in the subfolder ${PACKAGE_NAME}. Only change this if your Community folder is somewhere else."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Community folder"
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE ConfirmCommunityDir
!insertmacro MUI_PAGE_DIRECTORY

!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_TITLE "Nobs SimTools installed"
!define MUI_FINISHPAGE_TEXT "Start MSFS 2024 and open Nobs SimTools from the toolbar at the top of the screen. In VR, open the toolbar from the in-sim menu.$\r$\n$\r$\nInstalled to:$\r$\n$INSTDIR\${PACKAGE_NAME}"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ── Functions shared by installer and uninstaller ──────────────────────────────
; NSIS needs separate copies (un.-prefixed) for the uninstaller, hence the macro.
!macro SHARED_FUNCTIONS un

  ; In: $R0 = haystack, $R1 = needle.  Out: $R2 = "1" if found, else "0".
  ; Clobbers $R3–$R6.
  Function ${un}StrContains
    StrCpy $R2 "0"
    StrLen $R3 $R1
    StrLen $R4 $R0
    IntOp $R4 $R4 - $R3
    ${For} $R5 0 $R4
      StrCpy $R6 $R0 $R3 $R5
      ${If} $R6 == $R1
        StrCpy $R2 "1"
        ${ExitFor}
      ${EndIf}
    ${Next}
  FunctionEnd

  ; Ask the user to close the sim if it is running: files in the Community folder may
  ; be locked, and the sim only mounts packages at startup anyway.
  Function ${un}WarnIfSimRunning
    ${Do}
      nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq ${SIM_EXE}" /NH'
      Pop $0 ; exit code
      Pop $R0 ; output — contains the exe name only when it is running
      StrCpy $R1 "${SIM_EXE}"
      Call ${un}StrContains
      ${If} $R2 != "1"
        ${ExitDo}
      ${EndIf}
      MessageBox MB_ABORTRETRYIGNORE|MB_ICONEXCLAMATION "Microsoft Flight Simulator 2024 is running.$\r$\n$\r$\nClose it and click Retry. Ignore continues anyway; the sim picks up the change the next time it starts." /SD IDIGNORE IDRETRY retry IDIGNORE ignore
      Quit
    ignore:
      ${ExitDo}
    retry:
    ${Loop}
  FunctionEnd

  ; In: $R0 = the package folder (…\Community\nobs-fs-simtools).
  ; Removes it. A developer junction (`pnpm link:community`) is unlinked WITHOUT
  ; touching what it points to. Clobbers $R1–$R2.
  Function ${un}RemovePackageDir
    ${If} $R0 == ""
      Return
    ${EndIf}
    System::Call 'kernel32::GetFileAttributesW(w R0) i .R1'
    ${If} $R1 = -1 ; INVALID_FILE_ATTRIBUTES: nothing there
      Return
    ${EndIf}
    IntOp $R2 $R1 & 0x400 ; FILE_ATTRIBUTE_REPARSE_POINT
    ${If} $R2 <> 0
      RMDir "$R0"
    ${Else}
      RMDir /r "$R0"
    ${EndIf}
  FunctionEnd

!macroend

!insertmacro SHARED_FUNCTIONS ""
!insertmacro SHARED_FUNCTIONS "un."

; ── Community folder detection ─────────────────────────────────────────────────
; Same logic as scripts/lib/community.ts — keep the two in sync.

; In/out: $R3 — returns the text between the first pair of double quotes, or "".
; Clobbers $R5–$R8.
Function ExtractQuoted
  StrLen $R5 $R3
  StrCpy $R6 0 ; position
  StrCpy $R7 -1 ; index just after the opening quote
  ${While} $R6 < $R5
    StrCpy $R8 $R3 1 $R6
    ${If} $R8 == '"'
      ${If} $R7 < 0
        IntOp $R7 $R6 + 1
      ${Else}
        IntOp $R8 $R6 - $R7
        StrCpy $R3 $R3 $R8 $R7
        Return
      ${EndIf}
    ${EndIf}
    IntOp $R6 $R6 + 1
  ${EndWhile}
  StrCpy $R3 ""
FunctionEnd

; In:  $R0 = path to a UserCfg.opt
; Out: $R1 = "<InstalledPackagesPath>\Community" when that folder exists, else "".
; Clobbers $R2–$R8.
Function CommunityFromUserCfg
  StrCpy $R1 ""
  ClearErrors
  FileOpen $R2 "$R0" r
  ${If} ${Errors}
    Return
  ${EndIf}
  ${Do}
    ClearErrors
    FileRead $R2 $R3
    ${If} ${Errors}
      ${ExitDo}
    ${EndIf}
    StrCpy $R4 $R3 21 ; length of "InstalledPackagesPath"
    ${If} $R4 == "InstalledPackagesPath"
      Call ExtractQuoted
      ${If} $R3 != ""
      ${AndIf} ${FileExists} "$R3\Community\*.*"
        StrCpy $R1 "$R3\Community"
      ${EndIf}
      ${ExitDo}
    ${EndIf}
  ${Loop}
  FileClose $R2
FunctionEnd

Function .onInit
  Call WarnIfSimRunning

  ; 0. A folder given on the command line (/D=...) wins over detection.
  ${If} $INSTDIR != ""
    StrCpy $DetectedFrom "Using the folder given on the command line."
    Return
  ${EndIf}

  ; 1. An upgrade goes where the previous version went.
  ReadRegStr $0 HKCU "${SETTINGS_KEY}" "CommunityPath"
  ${If} $0 != ""
  ${AndIf} ${FileExists} "$0\*.*"
    StrCpy $INSTDIR $0
    StrCpy $DetectedFrom "Found your previous Nobs SimTools installation."
    Return
  ${EndIf}

  ; 2. Steam
  StrCpy $R0 "$APPDATA\Microsoft Flight Simulator 2024\UserCfg.opt"
  Call CommunityFromUserCfg
  ${If} $R1 != ""
    StrCpy $INSTDIR $R1
    StrCpy $DetectedFrom "Found MSFS 2024 (Steam)."
    Return
  ${EndIf}

  ; 3. Microsoft Store / Xbox app
  StrCpy $R0 "$LOCALAPPDATA\Packages\Microsoft.Limitless_8wekyb3d8bbwe\LocalCache\UserCfg.opt"
  Call CommunityFromUserCfg
  ${If} $R1 != ""
    StrCpy $INSTDIR $R1
    StrCpy $DetectedFrom "Found MSFS 2024 (Microsoft Store)."
    Return
  ${EndIf}

  StrCpy $DetectedFrom "MSFS 2024 was not found automatically. Click Browse and select your Community folder."
FunctionEnd

; Next stays disabled until an existing folder is selected.
Function .onVerifyInstDir
  ${IfNot} ${FileExists} "$INSTDIR\*.*"
    Abort
  ${EndIf}
FunctionEnd

Function ConfirmCommunityDir
  ${GetFileName} "$INSTDIR" $0
  ${If} $0 != "Community"
    MessageBox MB_YESNO|MB_ICONEXCLAMATION "The selected folder is not named $\"Community$\":$\r$\n$INSTDIR$\r$\n$\r$\nMSFS only loads add-ons from its Community folder. Install here anyway?" /SD IDYES IDYES confirmed
    Abort
  confirmed:
  ${EndIf}
FunctionEnd

; ── Install ────────────────────────────────────────────────────────────────────
Section "Install"
  ; Moving to a different Community folder? Remove the copy in the old one.
  ReadRegStr $0 HKCU "${SETTINGS_KEY}" "CommunityPath"
  ${If} $0 != ""
  ${AndIf} $0 != $INSTDIR
    StrCpy $R0 "$0\${PACKAGE_NAME}"
    Call RemovePackageDir
  ${EndIf}

  ; Replace any previous version completely, so files removed in this version don't linger.
  StrCpy $R0 "$INSTDIR\${PACKAGE_NAME}"
  Call RemovePackageDir

  SetOutPath "$INSTDIR\${PACKAGE_NAME}"
  File /r "${PACKAGE_DIR}\*.*"

  SetOutPath "${TOOLS_DIR}"
  File "/oname=icon.ico" "assets\icon.ico"
  WriteUninstaller "${TOOLS_DIR}\uninstall.exe"

  WriteRegStr HKCU "${SETTINGS_KEY}" "CommunityPath" "$INSTDIR"

  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "${TOOLS_DIR}\icon.ico"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR\${PACKAGE_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '"${TOOLS_DIR}\uninstall.exe"'
  WriteRegStr HKCU "${UNINSTALL_KEY}" "QuietUninstallString" '"${TOOLS_DIR}\uninstall.exe" /S'
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR\${PACKAGE_NAME}" "/S=0K" $0 $1 $2
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "EstimatedSize" $0
SectionEnd

; ── Uninstall ──────────────────────────────────────────────────────────────────
Function un.onInit
  Call un.WarnIfSimRunning
FunctionEnd

Section "Uninstall"
  ReadRegStr $0 HKCU "${SETTINGS_KEY}" "CommunityPath"
  ${If} $0 != ""
    StrCpy $R0 "$0\${PACKAGE_NAME}"
    Call un.RemovePackageDir
  ${EndIf}

  ; $INSTDIR is the uninstaller's own folder here (TOOLS_DIR).
  Delete "$INSTDIR\uninstall.exe"
  Delete "$INSTDIR\icon.ico"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "${UNINSTALL_KEY}"
  DeleteRegKey HKCU "${SETTINGS_KEY}"
SectionEnd
