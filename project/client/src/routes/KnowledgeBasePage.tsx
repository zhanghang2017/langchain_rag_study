import LeftSidebar from "../components/LeftSidebar";
import KnowledgeTable from "../components/KnowledgeTable";
import MaterialIcon from "../components/MaterialIcon";
import TopHeader from "../components/TopHeader";

const KnowledgeBasePage = () => {
  return (
    <div className="bg-white font-sans text-[#191c1e]">
      <TopHeader active="knowledge" />
      <LeftSidebar active="knowledge" showSettings />

      <main className="ml-0 min-h-screen px-6 pb-20 pt-24 md:ml-64 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <h1 className="font-headline mb-1 text-3xl font-bold tracking-tight text-black">
              Knowledge Base
            </h1>
            <p className="text-sm text-slate-500">Upload and manage organizational data for RAG retrieval.</p>
          </div>

          <div className="space-y-12">
            <div className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-12 transition-all hover:border-slate-200">
              <div className="mb-4 text-slate-400 transition-colors group-hover:text-black">
                <MaterialIcon name="cloud_upload" className="!text-4xl" />
              </div>
              <h3 className="font-headline mb-1 text-lg font-semibold text-black">Upload Assets</h3>
              <p className="mb-6 text-sm text-slate-400">Drag and drop PDF, DOCX, or TXT files</p>
              <button className="rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                Select Files
              </button>
            </div>

            <KnowledgeTable />

            <div className="md:hidden fixed bottom-0 left-0 z-50 grid h-14 w-full grid-cols-2 border-t border-slate-100 bg-white">
              <button className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
                <MaterialIcon name="chat_bubble" className="!text-xl" />
                <span className="text-[9px] font-medium">Chat</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-0.5 text-black">
                <MaterialIcon name="database" className="!text-xl" filled />
                <span className="text-[9px] font-bold">Knowledge</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KnowledgeBasePage;
