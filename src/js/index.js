const {Inode,fromBuffer}  = require("./Inode");
const Buffer = require("buffer").Buffer;


document.getElementById("pushData").addEventListener('click', ()=>{
try{

//Access keys from storage
const getFromLocalStorage = (key) => window.localStorage.getItem(key);
const setInLocalStorage = (key,value, encoder) => window.localStorage.setItem(key,encoder(value));

//Decode and Encode Data from LocalStorage
const decodeFileMetaData = (data) => fromBuffer( Buffer.from(data,"base64"));
const encodeFileMetaData  = (data) => (data.toBuffer()).toString("base64");
const decodeFileData = (value)=>atob(value);
const encodeFileData = (value)=>btoa(value)

const rootData = decodeFileMetaData(getFromLocalStorage('/'));

console.log(rootData);

console.log(encodeFileMetaData(rootData));

const fileKeyList = (JSON.parse(atob(getFromLocalStorage(rootData.id))));

console.log(fileKeyList);

//pull data
const getFileMetaData = (key)=>decodeFileMetaData(getFromLocalStorage(key)); 
const getFileData = (key)=>decodeFileData(getFromLocalStorage(key));
//set data



//Can be cleaned up
//convert to object to list
const data = Object.entries(fileKeyList)
//convert Keys to Data
const newData = data.map((arr)=>( [arr[0].toString(), getFileMetaData(arr[1])]));
//convert Return Object structure
const fileMetaData = newData.reduce((acc,[k,v])=>({...acc,[k]:v}),{});
console.log(fileMetaData);

//encode test
let fileData ={};
for(const key in fileMetaData){
    fileData[key] = getFileData(fileMetaData[key].id);
}
const f = "l.asm";
console.log(fileData);
fileData[f] = 
`COMMENT !
Author: Stephen Charbonneau
PROJECT: ASSIGNMENT 5 PART C
Date: 2020-08-05
Course: COSC2406
Description: Asks a user for a number selection from 0 to 15 for an initial text and
             background colour then a character which it prints on the screen in random
             positions 512 times displaying every combination of text and background
             colour twice

PSEUDO CODE:

MAIN

String list //Contains a list of all colurs in a menu im not writing it here
Scanner input = new Scanner(System.in)

//User input
PRINT(list)
PRINT("Please select a text colour")
int textNum = input.nextInt()
PRINT("Please select a background colour")
int backgroundNum = input.nextInt()
//Get character to print
PRINT("Please input a char to print")
int backgroundNum = input.nextChar()

//Set initial text and background colours
SetTextColor(backgroundNum*16+textNum)

//get all combinations of text and backgroundcolour
//ignore invalid scope im lazy
for(int i =0;i<16;i++){
   for(int j=0;j<16;j++){
      int[] colorCombo = (j*16)+i
   }
}

//get max number of x and y
//assume index = 0 is x and index = 1 is y
int[] maxNumConsoleRows = getMaxXY()

//Loop 2 times outer loop 2*256 = 512
int ecx = 2
do{
   //save ecx on stack
   push ecx
   int i = 0 //Restores counter after every loop
   //print character in random positons with every colour and background colour
   do{
   //set terminal curser to random position in terminal to write
   gotoXY(BetterRandomRange(0,maxNumConsoleRows[0]),
          BetterRandomRange(0,maxNumConsoleRows[1]))
   
   //Set colours and increment text colour combo
   SetTextColor(colorCombo[i++])

   }while(--ecx)

   //restore ecx outer counter
   pop ecx
}while(--ecx)

END MAIN

!

INCLUDE D:/irvine/Irvine32.inc
.data                          ;data decleration

txtColor  DWORD ?
bkgColor  DWORD ?
chrToPrnt BYTE  ?

colorOpt   BYTE  "Color Options:",0 
selCol1    BYTE  "     red = 4           gray = 8       lightRed = 12",0
selCol2    BYTE  "     blue = 1          magenta = 5    lightBlue = 9",0
selCol3    BYTE  "     lightMagenta = 13 green = 2      brown = 6",0
selCol4    BYTE  "     lightGreen = 10   yellow = 14    cyan = 3",0
selCol5    BYTE  "     lightGray = 7     lightCyan = 11 white = 15",0

inputMsg1  BYTE  "Please provide a number to select a text colour: ",0
inputMsg2  BYTE  "Please provide a number to select a background colour: ",0
inputMsg3  BYTE  "Please provide a single character: ",0

maxWinY    BYTE  ?
maxWinX    BYTE  ?

colorCombo DWORD 256 DUP(?) 

.code                          ;code decleration

;-----------------------------------------
;
; Generates a random number between a given
; Max and min value inclusive, should be called
; after Randomize function call
; Recieves: EAX, EBX, two 32-bit integers may 
;           be signed or unsigned, where 
;           EAX > EBX and EAX != EBX
; Returns: EAX = Random Number between EAX 
;          and EBX
;-----------------------------------------
BetterRandomRange PROC USES ebx edx
   pushfd                      ;Save flags 

   mov edx, eax                ;edx = eax
   sub eax, ebx                ;eax -= ebx (Max-Min)
   add eax, 1                  ;eax += 1  (Max+1-Min)
   call RandomRange            ;Generate random number Random(Max-Min+1)
   add eax, ebx                ;eax+=ebx Random(Max-Min+1) + Min

   popfd                       ;Restore flags
   ret                         ;Returns eax, restores ebx, and edx (USES)

BetterRandomRange ENDP         ;End Function

;-----------------------------------------
;
; Multiplies a number by 16 
; Recieves: EAX integer value
; Returns: EAX = EAX*16
;-----------------------------------------
MultiplyBy16 PROC   
   pushfd                      ;Save flags 
   
   add eax, eax                ;ebx+=eax=2*eax
   add eax, eax                ;ebx+=eax=4*eax
   add eax, eax                ;ebx+=eax=8*eax
   add eax, eax                ;ebx+=eax=16*eax


   popfd                       ;Restore flags
   ret                         ;Returns eax*16

MultiplyBy16 ENDP              ;End Function

;-----------------------------------------
;
; Computes all combinations of 15 colours
; Recieves: DWORD array offset in ESI
; Returns: A filled array with 256 colour
;          combinations
;-----------------------------------------
getColorCombinations PROC USES esi eax ebx ecx
   pushfd                      ;Save flags 

   mov ecx, 16                 ;Set loop to loop 16 times
   xor eax, eax                ;eax=0              
   xor ebx, ebx                ;ebx=0

   mov ecx, 0

   D2:

   loop D2

C1:                            ;Model nested for loop (eax=0 to 15)
      push ecx                 ;Save ecx to restore after nested loop
      push ebx                 ;Save ebx to restore after nested loop
      mov ecx, 0              ;Loop 16 times in inner loop

C2:                            ;Nested loop (ebx=0 to 15)
         push eax              ;Save eax as it needs to be multiplied by 16
         mov [esi], ebx        ;Move ebx to array
         call MultiplyBy16     ;Multiply eax by 16
         add [esi], eax        ;Add eax*16 to esi
         pop eax               ;Restore eax
         add esi, TYPE DWORD   ;Increment esi 

         inc ebx               ;Increment ebx so it goes from 0 to 15
         loop C2               ;loop back to inner loop
      pop ebx                  ;Restore ebx to 15
      pop ecx                  ;Restore outer loop count ecx
      inc eax                  ;increment eax
      loop C1
   
   popfd                       ;Restore flags
   ret                         ;Returns eax*16

getColorCombinations ENDP      ;End Function


main PROC                      ;main method starts

                               ;Print Colour Menu
   mov edx, OFFSET colorOpt    ;Write out info message
   call WriteString
   call CrLf
                               ;Write out color menu:
   mov edx, OFFSET selCol1     ;Write out colour options message
   call WriteString
   call CrLf
   mov edx, OFFSET selCol2     ;Write out colour options message
   call WriteString
   call CrLf
   mov edx, OFFSET selCol3     ;Write out colour options message
   call WriteString
   call CrLf
   mov edx, OFFSET selCol4     ;Write out colour options message
   call WriteString
   call CrLf
   mov edx, OFFSET selCol5     ;Write out colour options message
   call WriteString
   call CrLf
   call CrLf

                               ;Read in background colour value
   mov edx, OFFSET inputMsg2   ;Prompt user for background colour value
   call WriteString
   call ReadInt                ;Get value entered by user
   call MultiplyBy16
   mov ebx, eax                ;Store value in eax in ebx for use later (to add to text)

                               ;Read in Text colour value
   mov edx, OFFSET inputMsg1   ;Prompt user for text colour value
   call WriteString
   call ReadInt                ;Get value entered by user
   add eax, ebx                ;Add background colour*16 to text colour

   call SetTextColor           ;Set text colour

   
                               ;Read in character value
   mov edx, OFFSET inputMsg3   ;Prompt user for a character
   call WriteString
   call ReadChar               ;Get value entered by user
   mov chrToPrnt, al           ;Store text colour value provided by user 

   call Randomize              ;Call randomize to seed random numbers
   
   call GetMaxXY
   mov maxWinX, dl             ;Save max number of buffer columns in terminal
   mov maxWinY, al             ;Save max number of buffer rows in terminal 

   mov esi, OFFSET colorCombo  ;Fill the array of 256 values with colour combos
   call getColorCombinations  

                                  ;Loop 256 times twice (512 loops)
   mov ecx, 2                     ;loop twice to print 256 colours 2 twos

L1:                               ;outer loop

      push ecx                    ;Save main loop counter value
      mov esi, OFFSET colorCombo  ;Reset esi to its OFFSET value
                                  ;Loop 256 printing colour combinations and character

      mov ecx, 256                ;set inner loop to loop 256 times
L2:                               ;inner loop
                                  ;Set colour combinations
         mov eax, [esi]   
         call SetTextColor        ;Set text colour
         add esi, TYPE DWORD      ;increment esi to print colours
         
                                  ;Print character at random location
                                  ;Generate random location Y to print
         movzx eax, maxWinY       ;Fn parameters: Set max to rows
         mov ebx, 0               ;Fn parameters: Set min to 0
         Call BetterRandomRange   ;Generate random Y location     
         mov dh, al                ;Save random Y location edx

                                  ;Generate random location X to print
         movzx eax, maxWinX       ;Fn parameters: Set max to rows, note ebx=0
         mov ebx, 0               ;Fn parameters: Set min to 0
         Call BetterRandomRange   ;Generate random X location     
         mov dl, al               ;Save random X location to ebx

         Call gotoxy              ;Place curser in random XY location

                                  ;Write character
         mov al, chrToPrnt        ;Print char 
         call WriteChar
         
         mov eax, 200             ;Pause for 1/5th of a second each loop
         call Delay               ;Run delay

         loop L2

      pop ecx                    ;Restore main loop counter value

      loop L1                    ;Return to L1


   exit                        ;Exit program
main ENDP
END main`


console.log(fileData);
fileMetaData[f].size = fileData[f].length;
console.log(fileMetaData);

//save file
console.log(fileKeyList);
setInLocalStorage(fileMetaData[f].id, fileData[f], encodeFileData);
setInLocalStorage(fileKeyList[f], fileMetaData[f], encodeFileMetaData);

}catch(e){
    console.trace({error: e });
}









/*
function writeFile(FS){

    console.log({ fs: FS.fileSystem(), yup: "HELLO" });
}

writeFile(FS);

*/


});