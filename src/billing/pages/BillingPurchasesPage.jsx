import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCamera,
  FiEdit3,
  FiFileText,
  FiPaperclip,
  FiUploadCloud,
  FiZap,
} from "react-icons/fi";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { ChipRow, SearchInput } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import PurchaseEditor from "@/billing/components/PurchaseEditor";
import PurchaseKnowledge from "@/billing/components/PurchaseKnowledge";
import PurchaseStock from "@/billing/components/PurchaseStock";
import { readSheet } from "@/billing/phonepeImport";
import {
  Field,
  Panel,
  Stat,
  downloadCsv,
  formatDateKey,
  inputClass,
  money,
  quickRanges,
  tableCellClass,
  tableHeadClass,
  todayKey,
} from "@/billing/billingShared";

/* Purchases — supplier bills, category-wise.
 *   Add: upload a photo / PDF / Excel / CSV of the bill and let AI fill it
 *        in, or type it in by hand. Either way the bill opens in the editor
 *        to check before saving.
 *   See: totals for any period by bill, category, supplier and GST rate. */

const VIEWS = [
  { value: "bills", label: "Bills" },
  { value: "categories", label: "By category" },
  { value: "suppliers", label: "By supplier" },
  { value: "gst", label: "GST paid" },
  { value: "stock", label: "Stock" },
  { value: "knowledge", label: "Reader knowledge" },
];

const ACCEPT =
  "image/*,application/pdf,.pdf,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

const numberCell = `${tableCellClass} text-right`;
const numberHead = `${tableHeadClass} text-right`;

const isSheet = (file) => /\.(xlsx|xls|csv)$/i.test(file?.name || "");

const BillingPurchasesPage = ({ onToast }) => {
  const [range, setRange] = useState(() => quickRanges()[4]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState("bills");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [useAi, setUseAi] = useState(true);
  const [uploading, setUploading] = useState("");
  const [dragging, setDragging] = useState(false);
  // { initial, readNote } while the editor is open.
  const [editor, setEditor] = useState(null);
  const fileInput = useRef(null);
  const cameraInput = useRef(null);

  const load = useCallback(async () => {
    if (!range.from || !range.to) return;
    setLoading(true);
    try {
      setData(
        await billingAPI.listPurchases({
          from: range.from,
          to: range.to,
          q: search.trim() || undefined,
          categoryId: categoryFilter || undefined,
        }),
      );
    } catch (error) {
      onToast(billingError(error, "Could not load purchases."), "error");
    } finally {
      setLoading(false);
    }
  }, [range, search, categoryFilter, onToast]);

  useEffect(() => {
    const timer = window.setTimeout(load, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const [stockItems, setStockItems] = useState([]);
  const loadStock = useCallback(() => {
    billingAPI
      .listStock()
      .then((response) => setStockItems(response.items))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    billingAPI
      .listCategories()
      .then((response) => setCategories(response.categories))
      .catch(() => {});
  }, []);

  const aiEnabled = Boolean(data?.aiEnabled);
  const suppliers = data?.suppliers || [];

  // All files chosen together are pages of ONE bill, in order.
  const openFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, 6);
    if (!files.length) return;
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      onToast("A file is over 10 MB. Use a smaller photo or PDF.", "error");
      return;
    }
    const read = useAi && aiEnabled;
    setUploading(
      read
        ? `Reading the bill${files.length > 1 ? ` (${files.length} pages)` : ""}…`
        : "Uploading the bill…",
    );
    try {
      let text = "";
      const sheet = files.find(isSheet);
      if (sheet) {
        const rows = await readSheet(sheet);
        text = rows
          .map((row) =>
            row
              .map((cell) =>
                cell instanceof Date
                  ? cell.toISOString().slice(0, 10)
                  : String(cell ?? ""),
              )
              .join("\t"),
          )
          .filter((line) => line.trim())
          .join("\n");
      }
      const result = await billingAPI.uploadPurchaseBill({ files, text, read });
      const base = { attachments: result.attachments || [] };
      if (result.draft) {
        const lineCount = result.draft.lines.length;
        const missing = result.draft.lines.filter((line) => !line.categoryId).length;
        const review = result.review || {};
        const parts = [
          `Read ${lineCount} item${lineCount === 1 ? "" : "s"}${
            result.meta ? ` in ${result.meta.seconds}s` : ""
          }.`,
          review.addsUp
            ? "The lines add up to the bill's own totals."
            : `Doesn't add up yet: ${(review.issues || []).join("; ")}.`,
          missing ? `${missing} need a category.` : "",
          review.linesToCheck ? `${review.linesToCheck} line${review.linesToCheck === 1 ? "" : "s"} to check (shaded).` : "",
          review.notes || "",
        ];
        setEditor({
          initial: { ...base, ...result.draft, source: "ai" },
          readNote: {
            tone: review.addsUp ? "info" : "error",
            text: parts.filter(Boolean).join(" "),
          },
        });
      } else {
        setEditor({
          initial: base,
          readNote: result.readError
            ? {
                tone: "error",
                text: `${result.readError} The file is attached. Type the bill in beside it.`,
              }
            : null,
        });
      }
    } catch (error) {
      onToast(billingError(error, error.message || "Could not upload the bill."), "error");
    } finally {
      setUploading("");
    }
  };

  const onPick = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    openFiles(files);
  };

  const openPurchase = async (id) => {
    try {
      const { purchase } = await billingAPI.getPurchase(id);
      setEditor({ initial: purchase, readNote: null });
    } catch (error) {
      onToast(billingError(error, "Could not open that purchase."), "error");
    }
  };

  const exportCsv = () => {
    const stamp = `${data.from}-to-${data.to}`;
    const { summary } = data;
    if (view === "bills") {
      downloadCsv(`purchases-${stamp}.csv`, [
        ["Date", "Supplier", "Bill no", "Categories", "Items", "Taxable", "GST", "Total"],
        ...data.purchases.map((entry) => [
          entry.dateKey,
          entry.supplierName,
          entry.invoiceNo,
          entry.categories.join(" / "),
          entry.itemCount,
          entry.taxable,
          entry.gst,
          entry.total,
        ]),
      ]);
    } else if (view === "categories") {
      downloadCsv(`purchases-by-category-${stamp}.csv`, [
        ["Category", "Lines", "Taxable", "GST", "Amount"],
        ...summary.byCategory.map((entry) => [
          entry.name,
          entry.lines,
          entry.taxable,
          entry.gst,
          entry.amount,
        ]),
      ]);
    } else if (view === "suppliers") {
      downloadCsv(`purchases-by-supplier-${stamp}.csv`, [
        ["Supplier", "Bills", "Total"],
        ...summary.bySupplier.map((entry) => [entry.name, entry.bills, entry.total]),
      ]);
    } else {
      downloadCsv(`purchase-gst-${stamp}.csv`, [
        ["GST %", "Taxable", "GST paid", "CGST", "SGST/IGST"],
        ...summary.byRate.map((entry) => [
          entry.gstRate,
          entry.taxable,
          entry.gst,
          Math.round((entry.gst / 2) * 100) / 100,
          Math.round((entry.gst / 2) * 100) / 100,
        ]),
      ]);
    }
  };

  const ranges = quickRanges();
  const summary = data?.summary;
  const topCategory = summary?.byCategory[0];

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
      { value: "none", label: "Without a category" },
    ],
    [categories],
  );

  return (
    <div className="space-y-4">
      {/* Add a bill */}
      <Panel title="Add a purchase bill">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div
            role="button"
            tabIndex={0}
            onClick={() => !uploading && fileInput.current?.click()}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !uploading) {
                fileInput.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!uploading) openFiles(event.dataTransfer.files);
            }}
            className={`flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center admin-motion ${
              dragging
                ? "border-[#c9a84c] bg-[#fdf6e3]"
                : "border-[#e3d7bb] bg-[#fffdf7] hover:border-[#c9a84c]"
            }`}
          >
            {uploading ? (
              <>
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
                <span className="text-sm font-semibold text-[#1f1709]">{uploading}</span>
                <span className="text-xs text-[#7d6c4d]">
                  Usually 10–30 seconds.
                </span>
              </>
            ) : (
              <>
                <FiUploadCloud className="text-2xl text-[#8b6914]" />
                <span className="text-sm font-semibold text-[#1f1709]">
                  Drop the supplier bill here, or tap to choose
                </span>
                <span className="text-xs text-[#7d6c4d]">
                  Photo, PDF, Excel or CSV · any layout, any way up · a bill
                  on 2 pages? choose both photos together
                </span>
              </>
            )}
          </div>

          <div className="flex flex-row flex-wrap gap-2 lg:w-[240px] lg:flex-col">
            <ActionButton
              variant="secondary"
              disabled={Boolean(uploading)}
              onClick={() => cameraInput.current?.click()}
              className="flex-1 gap-2"
            >
              <FiCamera /> Take a photo
            </ActionButton>
            <ActionButton
              variant="secondary"
              disabled={Boolean(uploading)}
              onClick={() => setEditor({ initial: {}, readNote: null })}
              className="flex-1 gap-2"
            >
              <FiEdit3 /> Type it in
            </ActionButton>
            <label
              className={`flex flex-1 items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                aiEnabled ? "bg-[#f6f1e6] text-[#4a3610]" : "bg-[#f6f1e6] text-[#9a8a6b]"
              }`}
              title={
                aiEnabled
                  ? "Uploaded bills are filled in by AI"
                  : "Add OPENAI_API_KEY to the backend settings to turn this on"
              }
            >
              <input
                type="checkbox"
                checked={useAi && aiEnabled}
                disabled={!aiEnabled}
                onChange={(event) => setUseAi(event.target.checked)}
              />
              <FiZap />
              {aiEnabled ? "Fill in with AI" : "AI not set up"}
            </label>
          </div>
        </div>
        {!aiEnabled && data && (
          <p className="mt-2 text-xs text-[#8a7a5c]">
            Uploaded bills are attached for you to type in beside. To have them
            filled in automatically, add an OpenAI key to the backend
            (OPENAI_API_KEY).
          </p>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={onPick}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPick}
        />
      </Panel>

      {/* Period and filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {ranges.map((entry) => {
            const active = entry.from === range.from && entry.to === range.to;
            return (
              <button
                type="button"
                key={entry.label}
                onClick={() => setRange(entry)}
                className={`h-10 rounded-[0.7rem] px-3.5 text-sm font-semibold admin-motion ${
                  active
                    ? "bg-[#1f1709] text-[#f3dd96]"
                    : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-end gap-2">
          <Field label="From">
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={todayKey()}
              onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : (
        summary && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Purchases"
                value={money(summary.total)}
                sub={`${formatDateKey(data.from, { year: undefined })} – ${formatDateKey(data.to)}`}
              />
              <Stat label="Bills" value={summary.bills} sub={`${summary.bySupplier.length} suppliers`} />
              <Stat label="GST paid" value={money(summary.gst)} sub={`on ${money(summary.taxable)} taxable`} />
              <Stat
                label="Biggest category"
                value={topCategory ? money(topCategory.amount) : "—"}
                sub={topCategory ? topCategory.name : "No purchases yet"}
              />
            </div>

            <Panel>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <ChipRow options={VIEWS} value={view} onChange={setView} />
                <div
                  className={`ml-auto flex-wrap items-center gap-2 ${
                    view === "knowledge" || view === "stock" ? "hidden" : "flex"
                  }`}
                >
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Supplier, bill no. or item"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className={`${inputClass} w-auto`}
                    aria-label="Filter by category"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ActionButton
                    variant="secondary"
                    onClick={exportCsv}
                    disabled={!data.purchases.length}
                  >
                    Export CSV
                  </ActionButton>
                </div>
              </div>

              {view === "stock" ? (
                <PurchaseStock
                  items={stockItems}
                  categories={categories}
                  onChanged={loadStock}
                  onToast={onToast}
                />
              ) : view === "knowledge" ? (
                <PurchaseKnowledge categories={categories} onToast={onToast} />
              ) : !data.purchases.length ? (
                <EmptyState message="No purchase bills in this period." />
              ) : (
                <div className="overflow-x-auto">
                  {view === "bills" && (
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className={tableHeadClass}>Date</th>
                          <th className={tableHeadClass}>Supplier</th>
                          <th className={tableHeadClass}>Bill no.</th>
                          <th className={tableHeadClass}>Categories</th>
                          <th className={numberHead}>GST</th>
                          <th className={numberHead}>Total</th>
                          <th className={tableHeadClass} />
                        </tr>
                      </thead>
                      <tbody>
                        {data.purchases.map((entry) => {
                          const off =
                            entry.billTotal !== null &&
                            Math.abs(entry.total - entry.billTotal) >= 1;
                          return (
                            <tr
                              key={entry.id}
                              onClick={() => openPurchase(entry.id)}
                              className="cursor-pointer hover:bg-[#fffaf0]"
                            >
                              <td className={`${tableCellClass} whitespace-nowrap`}>
                                {formatDateKey(entry.dateKey)}
                              </td>
                              <td className={`${tableCellClass} font-semibold`}>
                                {entry.supplierName}
                              </td>
                              <td className={tableCellClass}>{entry.invoiceNo || "—"}</td>
                              <td className={tableCellClass}>
                                <span className="text-sm">{entry.categories.join(", ")}</span>
                                <span className="block text-xs text-[#7d6c4d]">
                                  {entry.itemCount} item{entry.itemCount === 1 ? "" : "s"}
                                </span>
                              </td>
                              <td className={numberCell}>{money(entry.gst)}</td>
                              <td className={`${numberCell} font-bold`}>
                                {money(entry.total)}
                                {off && (
                                  <span className="block text-[11px] font-semibold text-[#a3271b]">
                                    Bill says {money(entry.billTotal)}
                                  </span>
                                )}
                              </td>
                              <td className={`${tableCellClass} whitespace-nowrap text-right text-[#8b6914]`}>
                                {entry.source === "ai" && (
                                  <StatusChip tone="info" className="!px-2 !py-0.5">
                                    AI
                                  </StatusChip>
                                )}
                                {entry.hasFile && <FiPaperclip className="ml-2 inline" title="Bill attached" />}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {view === "categories" && (
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className={tableHeadClass}>Category</th>
                          <th className={numberHead}>Lines</th>
                          <th className={numberHead}>Taxable</th>
                          <th className={numberHead}>GST</th>
                          <th className={numberHead}>Amount</th>
                          <th className={`${tableHeadClass} w-1/4`} />
                        </tr>
                      </thead>
                      <tbody>
                        {summary.byCategory.map((entry) => (
                          <tr key={entry.categoryId || "none"}>
                            <td className={`${tableCellClass} font-semibold`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCategoryFilter(entry.categoryId || "none");
                                  setView("bills");
                                }}
                                className="hover:underline"
                              >
                                {entry.name}
                              </button>
                            </td>
                            <td className={numberCell}>{entry.lines}</td>
                            <td className={numberCell}>{money(entry.taxable)}</td>
                            <td className={numberCell}>{money(entry.gst)}</td>
                            <td className={`${numberCell} font-bold`}>{money(entry.amount)}</td>
                            <td className={tableCellClass}>
                              <div className="h-2 rounded-full bg-[#f3ecdb]">
                                <div
                                  className="h-2 rounded-full bg-[#c9a84c]"
                                  style={{
                                    width: `${Math.max(2, (entry.amount / (summary.byCategory[0]?.amount || 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {summary.extras !== 0 && (
                          <tr>
                            <td className={`${tableCellClass} text-[#7d6c4d]`} colSpan={4}>
                              Other charges and round off
                            </td>
                            <td className={numberCell}>{money(summary.extras)}</td>
                            <td className={tableCellClass} />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {view === "suppliers" && (
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className={tableHeadClass}>Supplier</th>
                          <th className={numberHead}>Bills</th>
                          <th className={numberHead}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.bySupplier.map((entry) => (
                          <tr key={entry.name}>
                            <td className={`${tableCellClass} font-semibold`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch(entry.name);
                                  setView("bills");
                                }}
                                className="hover:underline"
                              >
                                {entry.name}
                              </button>
                            </td>
                            <td className={numberCell}>{entry.bills}</td>
                            <td className={`${numberCell} font-bold`}>{money(entry.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {view === "gst" && (
                    <>
                      <table className="w-full border-separate border-spacing-0">
                        <thead>
                          <tr>
                            <th className={tableHeadClass}>GST rate</th>
                            <th className={numberHead}>Taxable value</th>
                            <th className={numberHead}>GST paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.byRate.map((entry) => (
                            <tr key={entry.gstRate}>
                              <td className={`${tableCellClass} font-semibold`}>{entry.gstRate}%</td>
                              <td className={numberCell}>{money(entry.taxable)}</td>
                              <td className={`${numberCell} font-bold`}>{money(entry.gst)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className={`${tableCellClass} font-bold`}>Total</td>
                            <td className={`${numberCell} font-bold`}>{money(summary.taxable)}</td>
                            <td className={`${numberCell} font-bold`}>{money(summary.gst)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8a7a5c]">
                        <FiFileText /> GST paid on purchases (input tax) for the
                        period, from the bills entered here.
                      </p>
                    </>
                  )}
                </div>
              )}
            </Panel>
          </>
        )
      )}

      {editor && (
        <PurchaseEditor
          initial={editor.initial}
          readNote={editor.readNote}
          aiEnabled={aiEnabled}
          categories={categories}
          stockItems={stockItems}
          suppliers={suppliers}
          onToast={onToast}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            load();
            loadStock();
          }}
          onDeleted={() => {
            setEditor(null);
            load();
            loadStock();
          }}
        />
      )}
    </div>
  );
};

export default BillingPurchasesPage;
