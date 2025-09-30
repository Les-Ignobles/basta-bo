export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
                <p className="text-gray-600 mb-4">
                    Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
                </p>
                <a 
                    href="/login" 
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    Retour à la page de connexion
                </a>
            </div>
        </div>
    )
}