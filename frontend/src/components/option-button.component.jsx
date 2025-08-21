const OptionButton = ({text,Icon,handleClick}) => {
    return ( 
        <button onClick={handleClick} className="flex gap-2 p-2 rounded border cursor-pointer">
            <Icon/>
            <span className="font-[500]">{text}</span>
        </button>
     );
}
 
export default OptionButton;