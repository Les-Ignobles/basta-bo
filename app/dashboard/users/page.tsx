"use client"
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserStore } from '@/features/users/stores/user-store'
import { UsersTable } from '@/features/users/components/users-table'
import { UsersExportDialog } from '@/features/users/components/users-export-dialog'

export default function UsersPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const {
        users, loading, total,
        page, pageSize, sortBy, sortOrder,
        fetchUsers, setPage, setSearch, setSort,
    } = useUserStore()

    const [searchInput, setSearchInput] = useState('')

    // Sync page from URL
    useEffect(() => {
        const pageParam = searchParams.get('page')
        if (pageParam && !isNaN(Number(pageParam))) {
            const pageNumber = Number(pageParam)
            if (pageNumber !== page) {
                setPage(pageNumber)
            }
        }
    }, [searchParams, page, setPage])

    // Fetch on page/sort change
    useEffect(() => {
        fetchUsers()
    }, [fetchUsers, page, sortBy, sortOrder])

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput)
            fetchUsers()
        }, 400)
        return () => clearTimeout(t)
    }, [searchInput, setSearch, fetchUsers])

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 50))), [total, pageSize])

    function handleSort(column: string) {
        if (sortBy === column) {
            setSort(column, sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSort(column, 'desc')
        }
    }

    function handlePageChange(newPage: number) {
        setPage(newPage)
        router.push(`/dashboard/users?page=${newPage}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Utilisateurs actifs</h1>
                    <p className="text-sm text-muted-foreground">
                        Users ayant généré au moins 1 session dans les 30 derniers jours
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm">
                        {total} utilisateurs
                    </Badge>
                    <UsersExportDialog />
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {page} / {totalPages}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page <= 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-md border">
                <UsersTable
                    users={users}
                    loading={loading}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />
            </div>
        </div>
    )
}
