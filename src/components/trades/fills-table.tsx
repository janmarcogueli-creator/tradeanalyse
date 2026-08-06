import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Fill {
  id: number;
  datetime: string;
  buySell: "BUY" | "SELL";
  quantity: number;
  price: number;
  commission: number;
}

export function FillsTable({ fills }: { fills: Fill[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Zeitpunkt</TableHead>
          <TableHead>Richtung</TableHead>
          <TableHead className="text-right">Menge</TableHead>
          <TableHead className="text-right">Preis</TableHead>
          <TableHead className="text-right">Kommission</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fills.map((fill) => (
          <TableRow key={fill.id}>
            <TableCell className="text-muted-foreground">
              {new Date(fill.datetime).toLocaleString("de-DE")}
            </TableCell>
            <TableCell>
              <Badge variant={fill.buySell === "BUY" ? "default" : "secondary"}>
                {fill.buySell === "BUY" ? "Kauf" : "Verkauf"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{fill.quantity}</TableCell>
            <TableCell className="text-right">{fill.price.toFixed(2)}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {fill.commission.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
