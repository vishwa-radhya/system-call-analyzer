const InfoCard = ({val,name,Icon}) => {
    return ( 
        <div className="border p-4 flex gap-5">
            <div className="flex flex-col gap-2">
                <p className="text-[20px]">{name}</p>
                <span>{val}</span>
            </div>
            <div className="flex items-center">
                <Icon />
            </div>
        </div>
     );
}
 
export default InfoCard;