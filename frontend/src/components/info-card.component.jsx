const InfoCard = ({val,name,Icon,content,iconColor}) => {
    return ( 
        <div className={`border p-4 flex flex-col gap-1  min-w-[200px] rounded bg-[]  bg-[whitesmoke] `}>
            <div>
                <Icon color={iconColor} />
            </div>
            <p className="text-[18px]">{name}</p>
            <div >
                <h2 className="text-[42px]">{val}</h2>
            </div>
            <div>
                <span className="text-[14px]">{content}</span>
            </div>
        </div>
     );
}
 
export default InfoCard;