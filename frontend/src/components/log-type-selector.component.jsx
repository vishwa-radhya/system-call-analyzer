const LogTypeSelector = ({handleSetCurrentLogType}) => {
    return ( 
        <div className="mt-1 rounded flex justify-around gap-2">
            <div className="log-type-selector-div" onClick={()=>handleSetCurrentLogType(0)}>Processes</div>
            <div className="log-type-selector-div" onClick={()=>handleSetCurrentLogType(1)}>FileIO</div>
            {/* <div className="log-type-selector-div" onClick={()=>handleSetCurrentLogType(2)}>Network</div> */}
        </div>
     );
}
 
export default LogTypeSelector;