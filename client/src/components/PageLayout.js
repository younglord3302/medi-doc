import React from 'react';

const PageLayout = ({
  title,
  subtitle,
  actions,
  children,
  className = ""
}) => {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-600">{subtitle}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </section>
  );
};

export default PageLayout;
