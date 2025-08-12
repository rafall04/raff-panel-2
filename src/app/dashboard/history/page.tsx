import { getReportHistory } from "../actions";
import HistoryView from "./view";

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const history = await getReportHistory();

    return <HistoryView history={history} />;
}
