"use client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowUpDown, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import type { ActiveUser } from "../types"

interface UsersTableProps {
    users: ActiveUser[]
    loading?: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    onSort: (column: string) => void
}

export function UsersTable({ users, loading, sortBy, sortOrder, onSort }: UsersTableProps) {
    const router = useRouter()
    function SortHeader({ column, label }: { column: string; label: string }) {
        const isActive = sortBy === column
        return (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort(column)}
            >
                {label}
                <ArrowUpDown className={`ml-1 size-3 ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                {isActive && <span className="ml-0.5 text-xs text-muted-foreground">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </Button>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><SortHeader column="firstname" label="Nom" /></TableHead>
                    <TableHead><SortHeader column="email" label="Email" /></TableHead>
                    <TableHead className="text-center">Premium</TableHead>
                    <TableHead className="text-center"><SortHeader column="session_count" label="Sessions" /></TableHead>
                    <TableHead><SortHeader column="last_session_at" label="Dernière session" /></TableHead>
                    <TableHead><SortHeader column="registered_at" label="Inscrit le" /></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto size-6 text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((user) => (
                        <TableRow key={user.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                            <TableCell className="font-medium">{user.firstname}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email ?? '—'}</TableCell>
                            <TableCell className="text-center">
                                {user.premium_sub_end_at && new Date(user.premium_sub_end_at) > new Date()
                                    ? <Crown className="size-4 text-yellow-500 mx-auto" />
                                    : <span className="text-muted-foreground">—</span>
                                }
                            </TableCell>
                            <TableCell className="text-center">{user.session_count}</TableCell>
                            <TableCell>
                                {formatDistanceToNow(new Date(user.last_session_at), { addSuffix: true, locale: fr })}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {format(new Date(user.registered_at), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
