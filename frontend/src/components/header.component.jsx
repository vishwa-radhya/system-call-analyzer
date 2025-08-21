import { Radio } from "lucide-react";
const Header = () => {
    return ( 
        <div className="flex w-full  justify-between">
            <div className="flex flex-col gap-2 p-2">
                <h2 >System Logs Dashboard</h2>
                <p>Real-time monitoring of system processes </p>
            </div>
            <div className="flex gap-1 border  p-2 h-fit my-[auto] mr-2 rounded-[4px]">   
                <Radio /> Live
            </div>
        </div>
     );
}
 
export default Header;