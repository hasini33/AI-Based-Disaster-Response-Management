function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </h2>

          {description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              {description}
            </p>
          )}
        </div>

        <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

      </div>

    </div>
  )
}

export default StatCard