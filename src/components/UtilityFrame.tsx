import { Tooltip } from "@base-ui/react/tooltip";
import { useCallback, useState } from "react";
import { useUIStore } from "../store";
import { AllNotesPanel } from "./AllNotesPanel";
import { IconButton } from "./IconButton";
import { icons } from "./icons";
import { SearchNotes } from "./SearchNotes";
import { SettingsDropdown } from "./SettingsDropdown";
import { UtilityNoteDetail } from "./UtilityNoteDetail";

export const UtilityFrame = () => {
  const activeUtilityPanel = useUIStore((state) => state.activeUtilityPanel);
  const toggleUtilityPanel = useUIStore((state) => state.toggleUtilityPanel);
  const rootRef = useUIStore((state) => state.rootRef);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);
  const [searchTooltipOpen, setSearchTooltipOpen] = useState(false);
  const [allNotesTooltipOpen, setAllNotesTooltipOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const hasSelectedNote = selectedNoteId !== null;
  const hasUtilityPanel = activeUtilityPanel !== null;

  const returnToPreviousPanel = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  const handleDetailRemove = useCallback(() => {
    setSelectedNoteId(null);
    setPanelRefreshKey((key) => key + 1);
  }, []);

  return (
    <div
      className="UtilityFrame"
      id="UtilityFrame"
      data-active-panel={activeUtilityPanel || undefined}
      data-settings-open={settingsMenuOpen || undefined}
    >
      <div className="UtilityToolbar">
        <div className="UtilityToolbarStart">
          {hasSelectedNote ? (
            <IconButton
              icon="arrowBack"
              onClick={returnToPreviousPanel}
              id="UtilityBackButton"
              aria-label="Back"
              title="Back"
            />
          ) : (
            <>
              <Tooltip.Root
                open={searchTooltipOpen}
                onOpenChange={(open) => {
                  if (open) setSearchTooltipOpen(true);
                }}
              >
                <Tooltip.Trigger
                  delay={0}
                  render={
                    <IconButton
                      icon="search"
                      onMouseEnter={() => setSearchTooltipOpen(true)}
                      onMouseLeave={() => setSearchTooltipOpen(false)}
                      onFocus={() => setSearchTooltipOpen(true)}
                      onBlur={() => setSearchTooltipOpen(false)}
                      onClick={() => {
                        setSearchTooltipOpen(false);
                        toggleUtilityPanel("search");
                      }}
                      id="SearchButton"
                      aria-label="Search notes"
                      data-active={activeUtilityPanel === "search"}
                    />
                  }
                />
                <Tooltip.Portal container={rootRef}>
                  <Tooltip.Positioner sideOffset={4}>
                    <Tooltip.Popup className="TooltipContent">
                      Search notes
                      <Tooltip.Arrow className="TooltipArrow">
                        {icons.popArrow}
                      </Tooltip.Arrow>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Tooltip.Root
                open={allNotesTooltipOpen}
                onOpenChange={(open) => {
                  if (open) setAllNotesTooltipOpen(true);
                }}
              >
                <Tooltip.Trigger
                  delay={0}
                  render={
                    <IconButton
                      icon="list"
                      onMouseEnter={() => setAllNotesTooltipOpen(true)}
                      onMouseLeave={() => setAllNotesTooltipOpen(false)}
                      onFocus={() => setAllNotesTooltipOpen(true)}
                      onBlur={() => setAllNotesTooltipOpen(false)}
                      onClick={() => {
                        setAllNotesTooltipOpen(false);
                        toggleUtilityPanel("all-notes");
                      }}
                      id="AllNotesButton"
                      aria-label="All notes"
                      data-active={activeUtilityPanel === "all-notes"}
                    />
                  }
                />
                <Tooltip.Portal container={rootRef}>
                  <Tooltip.Positioner sideOffset={4}>
                    <Tooltip.Popup className="TooltipContent">
                      All notes
                      <Tooltip.Arrow className="TooltipArrow">
                        {icons.popArrow}
                      </Tooltip.Arrow>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </>
          )}
        </div>

        <div className="UtilityToolbarEnd">
          <SettingsDropdown onMenuOpenChange={setSettingsMenuOpen} />
        </div>
      </div>

      {hasUtilityPanel ? (
        <div hidden={hasSelectedNote}>
          {activeUtilityPanel === "search" && (
            <SearchNotes
              onSelectNote={setSelectedNoteId}
              refreshKey={panelRefreshKey}
            />
          )}
          {activeUtilityPanel === "all-notes" && (
            <AllNotesPanel
              onSelectNote={setSelectedNoteId}
              refreshKey={panelRefreshKey}
            />
          )}
        </div>
      ) : null}

      {selectedNoteId ? (
        <UtilityNoteDetail
          noteId={selectedNoteId}
          onRemove={handleDetailRemove}
          onMissingNote={returnToPreviousPanel}
        />
      ) : null}
    </div>
  );
};
