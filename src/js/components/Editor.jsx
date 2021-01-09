import React from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2'
import CodeMirror from 'react-codemirror2';
import "codemirror/mode/gas/gas.js"

function Editor(props) {
    const {value, handleChange} = props;
    return (
        <CodeMirror value={value}
        onChange={handleChange}
        className="Editor"
        options={{
            lineWrapping: true,
            lineNumbers: true,
            mode: 'gas',
            theme: 'material'
        }}
        ></CodeMirror>
    );
}

export default Editor;
/*
 
export default function Editor(props){
    const{
        value,
        onChange
    } = props;

function handleChange(data, value) {onChange(value);}

return (<CodeMirror
onBeforeChange={handleChange}
value={value}
className="code-mirror"
  options={{
    lineWrapping: true,
    mode: 'gas',
    theme: 'material',
    lineNumbers:  true,
  }}
/>);

}

*/