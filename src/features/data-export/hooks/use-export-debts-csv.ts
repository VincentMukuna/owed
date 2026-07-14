import { useCallback, useState } from "react";

import { Alert } from "react-native";

import * as Sharing from "expo-sharing";

import { writeCsvExport } from "@/features/data-export/files/csv-export-store";
import {
  DEBT_CSV_MIME_TYPE,
  DEBT_CSV_UTI,
  createDebtCsv,
  suggestDebtCsvFileName,
} from "@/features/data-export/lib/debt-csv";
import { debtExportRepository } from "@/features/data-export/repositories/debt-export-repository";
import { useUiStore } from "@/features/debts/store/ui-store";
import { selectionChange } from "@/lib/haptics";

export function useExportDebtsCsv() {
  const showToast = useUiStore((state) => state.showToast);
  const [isExporting, setIsExporting] = useState(false);

  const exportDebts = useCallback(async () => {
    selectionChange();
    setIsExporting(true);

    try {
      const rows = await debtExportRepository.listRows();

      if (rows.length === 0) {
        Alert.alert("Nothing to Export", "Add a debt before creating a CSV export.");
        return;
      }

      const createdAt = new Date();
      const file = writeCsvExport(
        suggestDebtCsvFileName(createdAt),
        createDebtCsv(rows, createdAt),
      );

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Native file sharing is not available on this device.");
      }

      await Sharing.shareAsync(file.uri, {
        dialogTitle: "Export Owwed Data",
        mimeType: DEBT_CSV_MIME_TYPE,
        UTI: DEBT_CSV_UTI,
      });
    } catch (error) {
      if (__DEV__) {
        console.error("[DataExport] failed to export debts CSV", error);
      }
      showToast("Could not export your data. Try again.");
    } finally {
      setIsExporting(false);
    }
  }, [showToast]);

  return {
    exportDebts,
    isExporting,
  };
}
