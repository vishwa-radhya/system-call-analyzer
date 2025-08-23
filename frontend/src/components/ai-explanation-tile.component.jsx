const AiExplanationTile = ({name,Icon,text}) => {
    return ( 
        <div className='flex flex-col gap-2 mb-5 p-1'>
            <div className='flex gap-2'><Icon/> <span className='font-medium '>{name || "UNKNOWN"}</span></div>
            <div>{text || "UNKNOWN"}</div>
        </div>
     );
}
 
export default AiExplanationTile;