import {Dialog,DialogTitle,DialogContent,DialogActions,Button,Typography} from "@mui/material";
import { useCallRequestContext } from "../context/CallRequestContext";

export default function CallRequestDialog() {
    const {
        callRequest,
        openDialog,
        closeCallDialog} = useCallRequestContext();
    return (
        <Dialog open={openDialog} onClose={closeCallDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
                Demande de rappel
            </DialogTitle>
            <DialogContent>
                <Typography variant="h6">
                    {callRequest?.customer_name}
                </Typography>
                <Typography>
                    {callRequest?.customer_phone}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() =>
                        navigator.clipboard.writeText(
                            callRequest?.customer_phone ?? ""
                        )}
                >
                    Copier
                </Button>
                <Button
                    component="a"
                    href={`tel:${callRequest?.customer_phone}`}
                >
                    Appeler
                </Button>
                <Button
                    variant="contained"
                    onClick={closeCallDialog}
                >
                    Traité
                </Button>
            </DialogActions>
        </Dialog>
    )
}
