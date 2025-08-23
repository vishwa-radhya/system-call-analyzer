const OptionButton = ({text,Icon,handleClick}) => {
    return ( 
        <button onClick={handleClick} className="flex gap-2 p-2 rounded border cursor-pointer">
            <Icon/>
            <p className="font-[500]">{text}</p>
        </button>
     );
}
 
export default OptionButton;