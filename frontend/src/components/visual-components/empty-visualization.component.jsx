import {ChartLine} from 'lucide-react';
const EmptyVisualization = () => {
    return ( 
        <div className='flex flex-col items-center p-10 gap-7'>
            <ChartLine size={60} />
            <span className='text-[18px]'>No log data available to display the timeline.</span>
        </div>
     );
}
 
export default EmptyVisualization;