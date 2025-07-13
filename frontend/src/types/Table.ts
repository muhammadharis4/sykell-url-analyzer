export type SortOrder = "asc" | "desc";

export interface TableColumn {
    id: string;
    label: string;
    align?: "left" | "center" | "right";
    minWidth?: number;
    sortable?: boolean;
}