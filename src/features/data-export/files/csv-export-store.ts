import { File, Paths } from "expo-file-system";

export type StoredCsvExport = {
  uri: string;
  name: string;
};

export function writeCsvExport(name: string, contents: string): StoredCsvExport {
  const file = new File(Paths.cache, name);

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(contents);

  return {
    uri: file.uri,
    name,
  };
}
