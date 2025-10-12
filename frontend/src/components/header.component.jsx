import { ChartCandlestick } from "lucide-react";
const Header = ({heading,label,isSideIconRequired=true}) => {
    return ( 
        <div className="flex w-full  justify-between">
            <div className="flex flex-col gap-2 p-2">
                <h2>{heading}</h2>
                <p>{label}</p>
            </div>
            {isSideIconRequired && <a className="flex gap-1 border  p-2 h-fit my-[auto] mr-2 rounded-[4px]" href="/visuals" target="_blank">   
                <ChartCandlestick /> Visualizations
            </a>}
        </div>
     );
}
export default Header;