// Top institute header bar shown on every screen (login, department select, app shell).
export default function SiteHeader({ showSearch = true }) {
  return (
    <header className="institute-header">
      <div className="identity-bar">
        <div className={showSearch ? "identity-inner" : "identity-inner centered"}>
          <img
            className="identity-logo-img identity-logo-left"
            src="/images/emblem.png"
            alt="Government emblem"
          />
          <div className="identity-title">
            <b>MEDICAL EDUCATION BOARD</b>
            <strong>Examination Marks System (EMS)</strong>
            <span>
              Board of Medical Education - Board of Examination in Nursing
            </span>
            <em>Government of Puducherry</em>
          </div>
          <img
            className="identity-logo-img identity-logo-right"
            src="/images/header_logo.png"
            alt="Institute logo"
          />
        </div>
      </div>
    </header>
  );
}
