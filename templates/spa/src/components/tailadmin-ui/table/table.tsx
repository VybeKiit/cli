import type { ReactNode } from 'react';

interface TableProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

interface TableHeaderProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

interface TableBodyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

interface TableRowProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

interface TableCellProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly isHeader?: boolean;
}

/**
 * Renders the TailAdmin table wrapper.
 *
 * @param props - Table wrapper props.
 * @returns A table element with the supplied rows.
 * @example
 * ```tsx
 * <Table>
 *   <TableBody />
 * </Table>
 * ```
 */
export const Table = ({ children = null, className = '' }: TableProps) => (
  <table className={`min-w-full  ${className}`}>{children}</table>
);

/**
 * Renders the TailAdmin table header.
 *
 * @param props - Header props.
 * @returns A table header element.
 * @example
 * ```tsx
 * <TableHeader>
 *   <TableRow />
 * </TableHeader>
 * ```
 */
export const TableHeader = ({ children = null, className = '' }: TableHeaderProps) => (
  <thead className={className}>{children}</thead>
);

/**
 * Renders the TailAdmin table body.
 *
 * @param props - Body props.
 * @returns A table body element.
 * @example
 * ```tsx
 * <TableBody>
 *   <TableRow />
 * </TableBody>
 * ```
 */
export const TableBody = ({ children = null, className = '' }: TableBodyProps) => (
  <tbody className={className}>{children}</tbody>
);

/**
 * Renders a TailAdmin table row.
 *
 * @param props - Row props.
 * @returns A table row element.
 * @example
 * ```tsx
 * <TableRow>
 *   <TableCell />
 * </TableRow>
 * ```
 */
export const TableRow = ({ children = null, className = '' }: TableRowProps) => (
  <tr className={className}>{children}</tr>
);

/**
 * Renders a TailAdmin table cell.
 *
 * @param props - Cell props.
 * @returns A table header or data cell.
 * @example
 * ```tsx
 * <TableCell isHeader>Name</TableCell>
 * ```
 */
export const TableCell = ({
  children = null,
  className = '',
  isHeader = false,
}: TableCellProps) => {
  const CellTag = isHeader ? 'th' : 'td';

  return <CellTag className={` ${className}`}>{children}</CellTag>;
};
