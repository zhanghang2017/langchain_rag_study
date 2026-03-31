import { useRef, useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import KnowledgeTable from "../components/KnowledgeTable";
import MaterialIcon from "../components/MaterialIcon";
import TopHeader from "../components/TopHeader";
import { libraryRows } from "../data/mockData";
import { uploadFileToKnowledgeBase } from "../workservice/uploadWorkservice";
import type { UploadLibraryRow } from "../workservice/uploadWorkservice";

const KnowledgeBasePage = () => {
  const [rows, setRows] = useState<UploadLibraryRow[]>(libraryRows);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      const optimisticRow: UploadLibraryRow = {
        icon: "upload_file",
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        status: "Checking",
        statusTone: "warning",
        added: "just now",
      };

      setRows((prev) => [optimisticRow, ...prev.filter((row) => row.name !== file.name)]);

      try {
        const result = await uploadFileToKnowledgeBase(file, {
          onUploadingProgress: (percent) => {
            const value = Math.floor(percent);
            setUploadProgress(value);
            setRows((prev) =>
              prev.map((row) =>
                row.name === file.name
                  ? {
                      ...row,
                      status: `Uploading ${value}%`,
                      statusTone: "warning",
                    }
                  : row,
              ),
            );
            setUploadMessage(`${file.name}: uploading ${value}%`);
          },
          onPhaseChange: (phase) => {
            setUploadPhase(phase);
            if (phase === "hashing") {
              setRows((prev) =>
                prev.map((row) =>
                  row.name === file.name
                    ? {
                        ...row,
                        status: "Checking",
                        statusTone: "warning",
                      }
                    : row,
                ),
              );
              setUploadMessage(`${file.name}: hashing...`);
            }
            if (phase === "uploading") {
              setRows((prev) =>
                prev.map((row) =>
                  row.name === file.name
                    ? {
                        ...row,
                        status: "Uploading",
                        statusTone: "warning",
                      }
                    : row,
                ),
              );
              setUploadMessage(`${file.name}: uploading...`);
            }
            if (phase === "done") {
              setUploadProgress(100);
            }
          },
        });

        setRows((prev) => prev.map((row) => (row.name === file.name ? result : row)));
        setUploadMessage(`${file.name}: ${result.status.toLowerCase()}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setRows((prev) =>
          prev.map((row) =>
            row.name === file.name
              ? {
                  ...row,
                  status: "Failed",
                  statusTone: "error",
                }
              : row,
          ),
        );
        setUploadMessage(`${file.name}: ${message}`);
        setUploadPhase("failed");
      }
    }

    setIsUploading(false);
  }

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
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(event) => {
                  void handleFilesSelected(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button
                className="rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </button>
              <div className="mt-4 w-full max-w-md">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  {uploadPhase ? `${uploadPhase}: ${uploadProgress}%` : "idle"}
                </p>
              </div>
              {uploadMessage ? <p className="mt-3 text-xs text-slate-500">{uploadMessage}</p> : null}
            </div>

            <KnowledgeTable rows={rows} />

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
