import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Bell,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckSquare,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Search,
  Users,
  X
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import AssistantChat from "./AssistantChat";

const advisorLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    to: "/pipeline",
    label: "Pipeline",
    icon: BriefcaseBusiness
  },
  {
    to: "/leads",
    label: "Leads",
    icon: Users
  },
  {
    to: "/clients",
    label: "Clients",
    icon: Users
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: CheckSquare
  },
  {
    to: "/email-templates",
    label: "Email Templates",
    icon: Mail
  }
];

const clientLinks = [
  {
    to: "/dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard
  },
  {
    to: "/documents",
    label: "My Documents",
    icon: FileText
  }
];

const pageNames = {
  "/dashboard": "Dashboard",
  "/pipeline": "Pipeline",
  "/leads": "Leads",
  "/clients": "Clients",
  "/documents": "Documents",
  "/tasks": "Tasks",
  "/email-templates": "Email Templates"
};

export default function Layout() {
  const {
    user,
    logout
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isClient =
    user?.role === "client";

  const links = isClient
    ? clientLinks
    : advisorLinks;

  const [notifications, setNotifications] =
    useState([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const displayRole = user?.role
    ? user.role
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    : "User";

  const addNotification = useCallback(
    (notification) => {
      const item = {
        id:
          `${Date.now()}-${Math.random()}`,
        ...notification,
        createdAt: new Date()
      };

      setNotifications((current) => [
        item,
        ...current
      ].slice(0, 20));

      setUnreadCount((count) => count + 1);
    },
    []
  );

  const handleDocumentUpdated = useCallback(
    (document) => {
      const status = document?.status;

      let title =
        "Document updated";

      let message =
        document?.name ||
        "A document was updated.";

      if (status === "PROCESSING") {
        title = "Document uploaded";
        message = `${document?.name || "Document"} is being checked.`;
      }

      if (status === "APPROVED") {
        title = "Document approved";
        message = `${document?.name || "Document"} was approved.`;
      }

      if (status === "REJECTED") {
        title = "Document rejected";
        message = `${document?.name || "Document"} needs attention.`;
      }

      addNotification({
        type: "document",
        title,
        message,
        status
      });
    },
    [addNotification]
  );

  const handleLeadCreated = useCallback(
    (lead) => {
      addNotification({
        type: "lead",
        title: "New lead received",
        message:
          lead?.firstName && lead?.lastName
            ? `${lead.firstName} ${lead.lastName} was added to the pipeline.`
            : "A new lead was added to the pipeline."
      });
    },
    [addNotification]
  );

  const handleLeadUpdated = useCallback(
    (lead) => {
      addNotification({
        type: "lead",
        title: "Lead updated",
        message:
          lead?.firstName && lead?.lastName
            ? `${lead.firstName} ${lead.lastName} was updated.`
            : "A lead was updated."
      });
    },
    [addNotification]
  );

  useSocket(user?.brokerageId, {
    documentUpdated:
      handleDocumentUpdated,
    leadCreated:
      handleLeadCreated,
    leadUpdated:
      handleLeadUpdated
  });

  const notificationItems = useMemo(
    () => notifications,
    [notifications]
  );

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true
    });
  };

  const markNotificationsRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const currentPage =
    pageNames[location.pathname] ||
    (isClient
      ? "My Case"
      : "LeadFlow");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            L
          </div>

          <div>
            <strong>LeadFlow</strong>

            <span>
              {isClient
                ? "Client Portal"
                : "Mortgage CRM"}
            </span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section-label">
            {isClient
              ? "MY CASE"
              : "WORKSPACE"}
          </div>

          {links.map(
            ({
              to,
              label,
              icon: Icon
            }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({
                  isActive
                }) =>
                  `nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon size={18} />

                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          {!isClient && (
            <div className="sidebar-help">
              <div className="help-icon">
                <BarChart3 size={15} />
              </div>

              <div>
                <strong>
                  Live workspace
                </strong>

                <span>
                  Real-time CRM updates
                </span>
              </div>
            </div>
          )}

          <div className="user-mini">
            <div className="avatar">
              {(user?.name || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="user-mini-info">
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {displayRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <span>
              {isClient
                ? "Client Portal"
                : "Workspace"}
            </span>

            <strong>
              {currentPage}
            </strong>
          </div>

          <div className="topbar-actions">
            {!isClient && (
              <label className="global-search">
                <Search size={16} />

                <input
                  placeholder="Search workspace..."
                  aria-label="Search workspace"
                />

                <kbd>⌘ K</kbd>
              </label>
            )}

            <div className="notification-wrapper">
              <button
                type="button"
                className={`topbar-icon ${
                  notificationsOpen
                    ? "active"
                    : ""
                }`}
                title="Notifications"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen(
                    (open) => !open
                  );

                  markNotificationsRead();
                }}
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9
                      ? "9+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <div>
                      <strong>
                        Notifications
                      </strong>

                      <span>
                        Live workspace activity
                      </span>
                    </div>

                    <button
                      type="button"
                      className="notification-close"
                      onClick={() =>
                        setNotificationsOpen(
                          false
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {notificationItems.length ===
                  0 ? (
                    <div className="notification-empty">
                      <Bell size={24} />

                      <strong>
                        You're all caught up
                      </strong>

                      <span>
                        New lead and document
                        activity will appear here.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="notification-list">
                        {notificationItems.map(
                          (item) => (
                            <div
                              className="notification-item"
                              key={item.id}
                            >
                              <div className="notification-item-icon">
                                {item.status ===
                                "APPROVED" ? (
                                  <Check
                                    size={16}
                                  />
                                ) : item.status ===
                                  "REJECTED" ? (
                                  <X
                                    size={16}
                                  />
                                ) : (
                                  <Bell
                                    size={16}
                                  />
                                )}
                              </div>

                              <div className="notification-item-content">
                                <strong>
                                  {item.title}
                                </strong>

                                <span>
                                  {item.message}
                                </span>

                                <small>
                                  {item.createdAt.toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit"
                                    }
                                  )}
                                </small>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        className="clear-notifications"
                        onClick={
                          clearNotifications
                        }
                      >
                        Clear notifications
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-avatar">
              {(user?.name || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      {!isClient && <AssistantChat />}
    </div>
  );
}