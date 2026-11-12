// The content of a new .asm file. The INCLUDELIB lines name the libraries Microsoft's LINK needs, so a
// program started here also builds with ML and LINK alone (assemble.bat names them for JWlink anyway).
export const ASM_TEMPLATE = `INCLUDE Irvine32.inc
INCLUDELIB Irvine32.lib
INCLUDELIB user32.lib
INCLUDELIB kernel32.lib

  .data                          ;data declaration

  
  .code                          ;code declaration

  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`;
