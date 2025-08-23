import { useState,Fragment } from 'react';
import {Button} from '../components/ui/button';
import { toast } from 'sonner';
import { Loader,FileChartColumn,FileBox,Lightbulb,ArrowRight,Bot } from 'lucide-react';
import AiExplanationTile from './ai-explanation-tile.component';

const LogAIAnalysis = ({currentLog}) => {
    const [aiResult,setAiResult]=useState('');
    const [loading,setLoading]=useState(false);
    const fetchAiExplanation=async()=>{
        if(!currentLog) {
            toast.error('Choose a log to generate Explanation');
            return;
        }
        setLoading(true);
        setAiResult('');
        try{
            const res = await fetch("http://localhost:5000/ai_explanation",{
                method:"POST",
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({log:currentLog}),
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);
            setAiResult(data?.explanation);
            console.log(data)
            toast.success('Ai Explanation generated successfully');
        }catch(e){
            toast.error('AI Explanation Failed')
            console.error(e.message);
        }finally{
            setLoading(false);
        }
    }
    return ( 
        <div className=" flex flex-col h-full items-center py-3 gap-4 ">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 break-words break-all w-full max-h-full text-wrap ">
                {(loading && !aiResult) && <div className='flex items-center justify-center h-full'>
                    <Loader size={'60'} />
                </div>}
                {(aiResult && !loading) && <Fragment>
                    <AiExplanationTile name='Summary' Icon={FileChartColumn} text={aiResult?.summary} />
                    <AiExplanationTile name='Details' Icon={FileBox} text={aiResult?.details} />
                    <AiExplanationTile name='Insight' Icon={Lightbulb} text={aiResult?.insight} />
                    <AiExplanationTile name='Next Step' Icon={ArrowRight} text={aiResult?.nextStep} />
                </Fragment>}
                {(!aiResult && !loading) && <div className='flex h-full flex-col items-center justify-center'>
                    <Bot size={'150'} color='lightgray' />
                    <p className='text-[19px] text-[gray]'>Get AI explanation for the system call log</p>
                </div>}
            </div>
            <p className='px-3'>**Caching AI explanations based on Process Names to reduce API calls, so same process names give same explanation, (IGNORE PIDs) </p>
            <Button className={'mt-1'} onClick={fetchAiExplanation}>AI Analysis</Button>
        </div>
     );
}
 
export default LogAIAnalysis;