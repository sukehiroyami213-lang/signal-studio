import { useState } from "react";
import Header from "@/components/Header";
import TheoryTab from "@/components/TheoryTab";
import SimulatorTab from "@/components/SimulatorTab";
import QuizTab from "@/components/QuizTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState("Theory");

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "Theory" && <TheoryTab />}
      {activeTab === "Simulator" && <SimulatorTab />}
      {activeTab === "Quiz" && <QuizTab />}
    </div>
  );
};

export default Index;
