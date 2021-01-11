import {Inode,fromBuffer}  from "./inode";
import {Buffer} from "buffer";


document.getElementById("pushData").addEventListener('click', ()=>{
try{

    console.log(window);
    console.log(Module);


const filesystem = Module.BrowserFS.get
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
`
INCLUDE D:/irvine/Irvine32.inc
.data                          ;data decleration

.code                          ;c:w
ode decleration

main PROC                      ;main method starts

   call DumpRegs

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