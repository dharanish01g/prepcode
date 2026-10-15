# Visual C++ runtime

The Windows release build copies Microsoft's Visual C++ runtime DLLs here
(see `.github/workflows/release.yml`), and they're bundled with prepcode
(see `tauri.windows.conf.json`). Microsoft allows shipping them next to a
program.

When a downloaded language won't start on Windows because a DLL is missing
(MySQL needs this runtime, and not every PC has it), prepcode copies these
next to the language's program and checks again (`check_runs` in
`src/runtimes.rs`).

Development builds have no DLLs here, so that fallback is skipped. To try it
on Windows, copy the DLLs from Visual Studio's
`VC\Redist\MSVC\<version>\x64\Microsoft.VC143.CRT` folder into this one.
They're ignored by git.
