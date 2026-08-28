using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class NoteApp : Form
{
    private TextBox txt;
    private TrackBar transparency;
    private bool pinned = false;

    public NoteApp()
    {
        FormBorderStyle = FormBorderStyle.None;
        TopMost = true;
        StartPosition = FormStartPosition.Manual;
        Size = new Size(400, 340);
        Location = new Point(120 + new Random().Next(0, 160), 100 + new Random().Next(0, 120));
        Opacity = 0.94;
        BackColor = Color.FromArgb(24, 24, 26);
        Text = "Заметка";
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

        // Табличная разметка: шапка / текст / ползунок
        TableLayoutPanel root = new TableLayoutPanel();
        root.Dock = DockStyle.Fill;
        root.ColumnCount = 1;
        root.RowCount = 3;
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 40));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));

        root.Controls.Add(MakeHeader(), 0, 0);
        root.Controls.Add(MakeText(), 0, 1);
        root.Controls.Add(MakeSlider(), 0, 2);

        Controls.Add(root);

        // Видимая тёмная обводка — чтобы было видно, за что тянуть край
        root.Paint += (s, e) =>
        {
            using (Pen pen = new Pen(Color.FromArgb(72, 72, 80), 1))
            {
                Rectangle r = root.ClientRectangle;
                r.Width -= 1; r.Height -= 1;
                e.Graphics.DrawRectangle(pen, r);
            }
        };
        root.Resize += (s, e) => root.Invalidate();
    }

    private const int CS_DROPSHADOW = 0x00020000;
    private const int WS_THICKFRAME = 0x00040000;
    private const int WM_NCHITTEST = 0x0084;
    private const int WM_NCLBUTTONDOWN = 0x00A1;
    private const int WM_NCCALCSIZE = 0x0083;
    private const int WM_NCPAINT = 0x0085;
    private const int WM_LBUTTONDOWN = 0x0201;
    private const int WM_MOUSEMOVE = 0x0200;
    private const int WM_SYSCOMMAND = 0x0112;
    private const int WM_GETMINMAXINFO = 0x0024;
    private const int SC_SIZE = 0xF000;
    private const int HTLEFT = 10, HTRIGHT = 11, HTTOP = 12, HTTOPLEFT = 13, HTTOPRIGHT = 14, HTBOTTOM = 15, HTBOTTOMLEFT = 16, HTBOTTOMRIGHT = 17;
    private const int RESIZE_MARGIN = 8;
    private const int MIN_W = 270, MIN_H = 190;

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams cp = base.CreateParams;
            cp.ClassStyle |= CS_DROPSHADOW;
            cp.Style |= WS_THICKFRAME;
            return cp;
        }
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_NCHITTEST)
        {
            Point p = PointToClient(new Point(m.LParam.ToInt32() & 0xFFFF, (m.LParam.ToInt32() >> 16) & 0xFFFF));
            int w = ClientSize.Width, h = ClientSize.Height;
            bool top = p.Y <= RESIZE_MARGIN, bottom = p.Y >= h - RESIZE_MARGIN;
            bool left = p.X <= RESIZE_MARGIN, right = p.X >= w - RESIZE_MARGIN;
            int ht = 1;
            if (top && left) ht = HTTOPLEFT;
            else if (top && right) ht = HTTOPRIGHT;
            else if (bottom && left) ht = HTBOTTOMLEFT;
            else if (bottom && right) ht = HTBOTTOMRIGHT;
            else if (left) ht = HTLEFT;
            else if (right) ht = HTRIGHT;
            else if (top) ht = HTTOP;
            else if (bottom) ht = HTBOTTOM;
            m.Result = (IntPtr)ht;
            return;
        }
        base.WndProc(ref m);
        if (m.Msg == WM_GETMINMAXINFO)
        {
            MINMAXINFO mm = (MINMAXINFO)Marshal.PtrToStructure(m.LParam, typeof(MINMAXINFO));
            mm.ptMinTrackSize = new POINT(MIN_W, MIN_H);
            Marshal.StructureToPtr(mm, m.LParam, false);
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; public POINT(int x, int y) { X = x; Y = y; } }

    [StructLayout(LayoutKind.Sequential)]
    public struct MINMAXINFO
    {
        public POINT ptReserved;
        public POINT ptMaxSize;
        public POINT ptMaxPosition;
        public POINT ptMinTrackSize;
        public POINT ptMaxTrackSize;
    }

    private Control MakeHeader()
    {
        Panel top = new Panel();
        top.Dock = DockStyle.Fill;
        top.BackColor = Color.FromArgb(30, 30, 33);
        top.MouseDown += (s, e) => DragWindow();

        // Левый блок: лого + название
        Panel left = new Panel();
        left.BackColor = Color.Transparent;
        left.Dock = DockStyle.Left;
        left.Width = 130;
        left.MouseDown += (s, e) => DragWindow();
        try
        {
            PictureBox logo = new PictureBox();
            logo.Image = Icon.ToBitmap();
            logo.SizeMode = PictureBoxSizeMode.StretchImage;
            logo.Size = new Size(20, 20);
            logo.Location = new Point(14, 10);
            left.Controls.Add(logo);
            logo.MouseDown += (s, e) => DragWindow();
        }
        catch { }
        Label tt = new Label();
        tt.Text = "Заметка";
        tt.ForeColor = Color.FromArgb(178, 178, 185);
        tt.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        tt.Location = new Point(40, 12);
        tt.AutoSize = false;
        tt.Size = new Size(80, 18);
        tt.MouseDown += (s, e) => DragWindow();
        left.Controls.Add(tt);
        top.Controls.Add(left);

        // Кнопки в ряд справа
        FlowLayoutPanel btns = new FlowLayoutPanel();
        btns.Dock = DockStyle.Right;
        btns.Width = 140;
        btns.FlowDirection = FlowDirection.RightToLeft;
        btns.Padding = new Padding(0, 9, 8, 0);
        btns.BackColor = Color.Transparent;
        btns.Controls.Add(MakeBtn(IconType.Close, "Закрыть", (s, e) => Close()));
        btns.Controls.Add(MakeBtn(IconType.Min, "Свернуть", (s, e) => WindowState = FormWindowState.Minimized));
        btns.Controls.Add(MakeBtn(IconType.Top, "Поверх всех окон", (s, e) => TopMost = !TopMost));
        btns.Controls.Add(MakeBtn(IconType.Pin, "Закрепить на месте", (s, e) => TogglePin()));
        top.Controls.Add(btns);

        return top;
    }

    private Control MakeText()
    {
        txt = new TextBox();
        txt.Multiline = true;
        txt.AcceptsReturn = true;
        txt.AcceptsTab = true;
        txt.ReadOnly = false;
        txt.Dock = DockStyle.Fill;
        txt.BorderStyle = BorderStyle.None;
        txt.BackColor = Color.FromArgb(24, 24, 26);
        txt.ForeColor = Color.FromArgb(235, 235, 240);
        txt.Font = new Font("Segoe UI", 10);
        txt.ScrollBars = ScrollBars.Vertical;
        txt.Padding = new Padding(10);
        return txt;
    }

    private Control MakeSlider()
    {
        Panel bottom = new Panel();
        bottom.Dock = DockStyle.Fill;
        bottom.BackColor = Color.FromArgb(24, 24, 26);

        Label lbl = new Label();
        lbl.Text = "Прозрачность";
        lbl.ForeColor = Color.FromArgb(160, 160, 168);
        lbl.Font = new Font("Segoe UI", 9);
        lbl.AutoSize = false;
        lbl.Width = 104;
        lbl.Height = 22;
        lbl.Location = new Point(16, 13);
        bottom.Controls.Add(lbl);

        transparency = new TrackBar();
        transparency.Minimum = 30;
        transparency.Maximum = 100;
        transparency.Value = 94;
        transparency.TickStyle = TickStyle.None;
        transparency.Size = new Size(210, 26);
        transparency.Location = new Point(130, 9);
        transparency.ValueChanged += (s, e) => Opacity = transparency.Value / 100.0;
        bottom.Controls.Add(transparency);

        return bottom;
    }

    private enum IconType { Pin, Top, Min, Close }

    private Button MakeBtn(IconType type, string tip, EventHandler onClick)
    {
        Button b = new Button();
        b.Size = new Size(30, 22);
        b.FlatStyle = FlatStyle.Flat;
        b.FlatAppearance.BorderSize = 0;
        b.BackColor = Color.Transparent;
        b.Cursor = Cursors.Hand;
        b.Margin = new Padding(1, 0, 1, 0);
        b.Paint += (s, e) => DrawIcon(e.Graphics, b.ClientRectangle, type, type == IconType.Close ? Color.FromArgb(230, 90, 90) : Color.FromArgb(176, 176, 182));
        b.MouseEnter += (s, e) => b.BackColor = Color.FromArgb(50, 50, 55);
        b.MouseLeave += (s, e) => b.BackColor = Color.Transparent;
        b.Click += onClick;
        ToolTip tt = new ToolTip();
        tt.SetToolTip(b, tip);
        return b;
    }

    private void DrawIcon(Graphics g, Rectangle r, IconType type, Color color)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using (Pen pen = new Pen(color, 1.6f))
        {
            pen.StartCap = LineCap.Round;
            pen.EndCap = LineCap.Round;
            pen.LineJoin = LineJoin.Round;
            float cx = r.X + r.Width / 2f;
            float cy = r.Y + r.Height / 2f;
            switch (type)
            {
                case IconType.Pin:
                    g.DrawEllipse(pen, cx - 4, cy - 6, 8, 8);
                    g.DrawLine(pen, cx, cy + 2, cx, cy + 7);
                    break;
                case IconType.Top:
                    g.DrawPolygon(pen, Points(cx, cy - 4, 7, 3));
                    g.DrawPolygon(pen, Points(cx, cy + 0, 7, 3));
                    break;
                case IconType.Min:
                    g.DrawLine(pen, cx - 6, cy, cx + 6, cy);
                    break;
                case IconType.Close:
                    g.DrawLine(pen, cx - 5, cy - 5, cx + 5, cy + 5);
                    g.DrawLine(pen, cx + 5, cy - 5, cx - 5, cy + 5);
                    break;
            }
        }
    }

    private PointF[] Points(float cx, float cy, float w, float h)
    {
        return new PointF[] {
            new PointF(cx, cy - h),
            new PointF(cx + w, cy),
            new PointF(cx, cy + h),
            new PointF(cx - w, cy),
        };
    }

    private void TogglePin() { pinned = !pinned; }

    private void DragWindow()
    {
        if (pinned) return;
        NativeMethods.ReleaseCapture();
        NativeMethods.SendMessage(Handle, 0xA1, 0x2, 0);
    }
}

public static class NativeMethods
{
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern bool ReleaseCapture();
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
}

public static class Program
{
    [STAThread]
    public static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new NoteApp());
    }
}
