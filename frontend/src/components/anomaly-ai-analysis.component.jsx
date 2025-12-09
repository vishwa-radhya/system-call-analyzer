import { useState, Fragment } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Loader, FileChartColumn, FileBox, Lightbulb, ArrowRight, Bot, ShieldAlert } from "lucide-react";
import AiExplanationTile from "./ai-explanation-tile.component";

const AnomalyAiAnalysis = ({ currentLog, aiResult, handleSetAiResult }) => {
  const [loading, setLoading] = useState(false);

  const fetchAiExplanation = async () => {
    if (!currentLog) {
      toast.error("Choose an anomaly to generate analysis");
      return;
    }

    setLoading(true);
    handleSetAiResult("");

    try {
      const res = await fetch("http://localhost:5000/ai_anomaly_explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomaly: currentLog }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      handleSetAiResult(data?.explanation);
      toast.success("AI Anomaly Analysis generated successfully");
    } catch (e) {
      toast.error("AI Anomaly Analysis Failed");
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center py-3 gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 w-full break-words">

        {(loading && !aiResult) && (
          <div className="flex items-center justify-center h-full">
            <Loader size={'60'} />
          </div>
        )}

        {(aiResult && !loading) && (
          <Fragment>
            <AiExplanationTile name="Summary" Icon={FileChartColumn} text={aiResult.summary} />
            <AiExplanationTile name="Severity Insight" Icon={ShieldAlert} text={aiResult.severityInsight} />
            <AiExplanationTile name="Behavior Details" Icon={FileBox} text={aiResult.behaviorDetails} />
            <AiExplanationTile name="Interpretation" Icon={Lightbulb} text={aiResult.interpretation} />
            <AiExplanationTile name="Next Step" Icon={ArrowRight} text={aiResult.nextStep} />
          </Fragment>
        )}

        {(!aiResult && !loading) && (
          <div className="flex h-full flex-col items-center justify-center">
            <Bot size={150} color="lightgray" />
            <p className="text-[19px] text-gray-500">AI analysis for anomaly batches</p>
          </div>
        )}

      </div>

      <p className="px-3 text-xs text-gray-500">
        **Caching by process + severity + reason signature to reduce AI calls**
      </p>

      <Button className="mt-1" onClick={fetchAiExplanation}>
        AI Analysis
      </Button>
    </div>
  );
};

export default AnomalyAiAnalysis;
