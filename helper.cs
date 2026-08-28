using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

public class AppData
{
    public static string Dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Правовой помощник");
    public static string FavFile { get { return Path.Combine(Dir, "favorites.txt"); } }
    public static string NotesFile { get { return Path.Combine(Dir, "notes.txt"); } }
    public static string AiFile { get { return Path.Combine(Dir, "ai_history.txt"); } }

    public static List<PopItem> Popular = new List<PopItem>();
    public static List<HbItem> Handbook = new List<HbItem>();
    public static List<NoteItem> Notes = new List<NoteItem>();
    public static List<AiMsg> AiHistory = new List<AiMsg>();

    static AppData() { Directory.CreateDirectory(Dir); Init(); Load(); }

    static void Init()
    {
        Popular.Add(new PopItem("17.6", "Неповиновение законному распоряжению", "Неповиновение законному распоряжению. Штраф до 35.000 руб / лишение до 30 мес.", "УК РФ", "уголовная", "35000"));
        Popular.Add(new PopItem("17.4", "Воспрепятствование", "Воспрепятствование законной деятельности. Штраф до 40.000 руб / лишение до 30 мес.", "УК РФ", "уголовная", "40000"));
        Popular.Add(new PopItem("17.3", "Оскорбление представителя власти", "Публичное оскорбление представителя власти. Штраф до 40.000 руб / лишение до 30 мес.", "УК РФ", "уголовная", "40000"));
        Popular.Add(new PopItem("17.2", "Насилие к представителю власти", "Применение насилия. Штраф до 60.000 руб / лишение до 30 мес.", "УК РФ", "уголовная", "60000"));
        Popular.Add(new PopItem("17.1", "Посягательство на жизнь сотрудника", "Посягательство на жизнь сотрудника. Лишение от 40 до 50 мес.", "УК РФ", "уголовная"));
        Popular.Add(new PopItem("15.5", "Дача взятки", "Дача взятки. Штраф до 70.000 руб / лишение до 30 мес.", "УК РФ", "уголовная", "70000"));
        Popular.Add(new PopItem("12.2ч1", "Кража", "Кража. Штраф до 30.000 руб / лишение до 20 мес.", "УК РФ", "уголовная", "30000"));
        Popular.Add(new PopItem("12.2ч2", "Грабеж", "Грабеж. Штраф до 50.000 руб / лишение до 40 мес.", "УК РФ", "уголовная", "50000"));
        Popular.Add(new PopItem("12.1ч1", "Убийство", "Убийство. Лишение от 30 до 50 мес.", "УК РФ", "уголовная"));
        Popular.Add(new PopItem("7.1", "Побои", "Побои. Штраф до 15.000 руб.", "КоАП РФ", "административная", "15000"));
        Popular.Add(new PopItem("6.3", "Оскорбление", "Оскорбление. Штраф до 10.000 руб.", "КоАП РФ", "административная", "10000"));
        Popular.Add(new PopItem("5.4", "Курение", "Курение в неположенном месте. Штраф до 15.000 руб.", "КоАП РФ", "административная", "15000"));
        Popular.Add(new PopItem("5.5", "Распитие спиртного", "Распитие спиртных напитков. Штраф до 15.000 руб.", "КоАП РФ", "административная", "15000"));
        Popular.Add(new PopItem("5.3", "Мат в общественном месте", "Нецензурная лексика. Штраф до 15.000 руб.", "КоАП РФ", "административная", "15000"));
        Popular.Add(new PopItem("12", "Пьяное вождение", "Управление авто при алкоголе >0.08%. Штраф до 10.000 руб.", "ДК РФ", "административная", "10000"));
        Popular.Add(new PopItem("17", "Телефон за рулем", "Использование телефона за рулем. Штраф до 7.000 руб.", "ДК РФ", "административная", "7000"));
        Popular.Add(new PopItem("7", "Неподчинение сотруднику", "Невыполнение требования об остановке. Штраф до 7.000 руб.", "ДК РФ", "административная", "7000"));

        Handbook.Add(new HbItem("Основания для задержания", new[] { "Лицо застигнуто в момент преступления", "На лице/одежде следы преступления", "Постановление или ордер", "Лицо в розыске", "Фото/видео фиксация" }));
        Handbook.Add(new HbItem("Порядок задержания", new[] { "Надеть наручники", "Представиться", "Сообщить причину", "Зачитать Миранду", "Обыск", "Установить личность", "Снять маску", "Доставить в КПЗ", "Вызвать адвоката", "Вызвать прокурора" }));
        Handbook.Add(new HbItem("Время задержания", new[] { "Адвокат/прокурор - 3 мин", "Начальство - 6 мин", "Ожидание - 10 мин", "Максимум - 60 мин" }));
        Handbook.Add(new HbItem("Порядок ареста", new[] { "Вторичный обыск", "Уровень розыска", "Огласить статьи", "Оформить арест" }));
        Handbook.Add(new HbItem("Миранда", new[] { "Вы имеете право хранить молчание...", "Вы имеете право на адвоката", "Зачитать повторно" }));
        Handbook.Add(new HbItem("Субъекты задержания", new[] { "Проводящий + 2", "Задержанный", "Адвокат", "Прокурор", "СК", "Руководитель", "УБОП", "СМИ", "Медик" }));
        Handbook.Add(new HbItem("Освобождение", new[] { "Нет лишения свободы", "Нет доказательств", "Непричастность", "Примирение", "Нет прокурора" }));
        Handbook.Add(new HbItem("Презумпция невиновности", new[] { "Невиновен до доказательства", "Не обязан доказывать", "Сомнения в пользу" }));
    }

    public static void Load()
    {
        try { if (File.Exists(FavFile)) { var s = new HashSet<string>(File.ReadAllLines(FavFile)); foreach (var a in Popular) if (s.Contains(a.Number)) a.IsFav = true; } } catch { }
        try { if (File.Exists(NotesFile)) { NoteItem cur = null; foreach (var l in File.ReadAllLines(NotesFile)) { if (l.StartsWith("## ")) { cur = new NoteItem(); long.TryParse(l.Substring(2), out cur.Id); Notes.Add(cur); } else if (l.StartsWith("!! ") && cur != null) cur.Title = l.Substring(3); else if (l.StartsWith("- [") && cur != null) cur.Items.Add(new CheckItem { Text = l.Length > 6 ? l.Substring(6) : "", Done = l.Length > 3 && l[3] == 'x' }); } } } catch { }
        try { if (File.Exists(AiFile)) { foreach (var l in File.ReadAllLines(AiFile)) { int i = l.IndexOf('|'); if (i > 0) AiHistory.Add(new AiMsg { Role = l.Substring(0, i), Content = l.Substring(i + 1).Replace("\\n", "\n") }); } } } catch { }
    }

    public static void SaveFav() { try { var l = new List<string>(); foreach (var a in Popular) if (a.IsFav) l.Add(a.Number); File.WriteAllLines(FavFile, l); } catch { } }
    public static void SaveNotes() { try { var l = new List<string>(); foreach (var n in Notes) { l.Add("## " + n.Id); l.Add("!! " + (n.Title ?? "")); foreach (var i in n.Items) l.Add("- [" + (i.Done ? "x" : " ") + "] " + (i.Text ?? "")); } File.WriteAllLines(NotesFile, l); } catch { } }
    public static void SaveAi() { try { var l = new List<string>(); foreach (var m in AiHistory) l.Add(m.Role + "|" + (m.Content ?? "").Replace("\n", "\\n")); File.WriteAllLines(AiFile, l); } catch { } }
    public static void SaveAll() { SaveFav(); SaveNotes(); SaveAi(); }
}

public class PopItem
{
    public string Number, Title, Text, Codec, Type, Fine;
    public bool IsFav;
    public PopItem(string n, string t, string x, string c, string tp, string f = null) { Number = n; Title = t; Text = x; Codec = c; Type = tp; Fine = f; }
}
public class HbItem
{
    public string Title;
    public string[] Content;
    public HbItem(string t, string[] c) { Title = t; Content = c; }
}
public class CheckItem { public string Text; public bool Done; }
public class NoteItem { public long Id; public string Title; public List<CheckItem> Items = new List<CheckItem>(); }
public class AiMsg { public string Role, Content; }

// ====== FORM ======
public class HelperForm : Form
{
    const int CS = 0x20000, WS = 0x40000, WM_NCHITTEST = 0x84, EDGE = 6, MIN_W = 420, MIN_H = 460;
    Color bg = Color.FromArgb(18, 18, 18), pnl = Color.FromArgb(24, 24, 26), hdr = Color.FromArgb(30, 30, 33);
    Color acc = Color.FromArgb(229, 57, 53), txt = Color.FromArgb(235, 235, 240), mut = Color.FromArgb(160, 160, 168);

    int tab = 0; bool pin = false, top = true;
    Panel[] pages = new Panel[6]; Button[] btns;
    string[] names = { "Все", "Статьи", "Памятка", "Избранное", "ИИ", "Заметки" };

    TextBox si; FlowLayoutPanel sr; Panel dp;
    ListBox hl; Label hc;
    FlowLayoutPanel fl;
    RichTextBox ac; TextBox ai; Button ab;

    public HelperForm()
    {
        Text = "Помощник"; BackColor = bg; ClientSize = new Size(520, 620); MinimumSize = new Size(MIN_W, MIN_H);
        FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.CenterScreen; TopMost = true;
        Build();
    }

    protected override CreateParams CreateParams { get { var cp = base.CreateParams; cp.ClassStyle |= CS; cp.Style |= WS; return cp; } }

    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; public POINT(int x, int y) { X = x; Y = y; } }
    [StructLayout(LayoutKind.Sequential)] struct MMI { public POINT a, b, c, d, e; }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_NCHITTEST)
        {
            var p = PointToClient(new Point(m.LParam.ToInt32() & 0xFFFF, (m.LParam.ToInt32() >> 16) & 0xFFFF));
            int w = ClientSize.Width, h = ClientSize.Height;
            bool t = p.Y <= EDGE, b = p.Y >= h - EDGE, l = p.X <= EDGE, r = p.X >= w - EDGE;
            int ht = 1;
            if (t && l) ht = 13; else if (t && r) ht = 14; else if (b && l) ht = 16; else if (b && r) ht = 17;
            else if (l) ht = 10; else if (r) ht = 11; else if (t) ht = 12; else if (b) ht = 15;
            m.Result = (IntPtr)ht; return;
        }
        base.WndProc(ref m);
        if (m.Msg == 0x24) { var mm = (MMI)Marshal.PtrToStructure(m.LParam, typeof(MMI)); mm.e = new POINT(MIN_W, MIN_H); Marshal.StructureToPtr(mm, m.LParam, false); }
    }

    void Build()
    {
        var r = new TableLayoutPanel(); r.Dock = DockStyle.Fill; r.ColumnCount = 1; r.RowCount = 3;
        r.RowStyles.Add(new RowStyle(SizeType.Absolute, 44)); r.RowStyles.Add(new RowStyle(SizeType.Absolute, 34)); r.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        r.BackColor = bg;
        r.Paint += (s, e) => { using (var pn = new Pen(Color.FromArgb(72, 72, 80), 1)) { var rr = r.ClientRectangle; rr.Width--; rr.Height--; e.Graphics.DrawRectangle(pn, rr); } };
        r.Resize += (s, e) => r.Invalidate();
        r.Controls.Add(Hdr(), 0, 0); r.Controls.Add(Tbs(), 0, 1); r.Controls.Add(Cnt(), 0, 2);
        Controls.Add(r); Sel(0);
    }

    Panel Hdr()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = hdr }; p.MouseDown += (s, e) => Drg();
        var ttl = new Label { Text = "  Помощник", ForeColor = txt, Font = new Font("Segoe UI", 11, FontStyle.Bold), Location = new Point(14, 11), AutoSize = true };
        ttl.MouseDown += (s, e) => Drg(); p.Controls.Add(ttl);
        var bt = new FlowLayoutPanel { Dock = DockStyle.Right, Width = 200, FlowDirection = FlowDirection.RightToLeft, Padding = new Padding(0, 8, 8, 0), BackColor = Color.Transparent };
        bt.Controls.Add(Btn("X", (s, e) => { AppData.SaveAll(); Close(); }));
        bt.Controls.Add(Btn("_", (s, e) => WindowState = FormWindowState.Minimized));
        bt.Controls.Add(Btn("^", (s, e) => { top = !top; TopMost = top; }));
        bt.Controls.Add(Btn("P", (s, e) => pin = !pin));
        p.Controls.Add(bt); return p;
    }

    Button Btn(string t, EventHandler h)
    {
        var b = new Button { Text = t, Size = new Size(30, 24), FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, BackColor = Color.Transparent, ForeColor = mut, Font = new Font("Segoe UI", 9), Cursor = Cursors.Hand, Margin = new Padding(1, 0, 1, 0) };
        b.MouseEnter += (s, e) => b.BackColor = Color.FromArgb(50, 50, 55); b.MouseLeave += (s, e) => b.BackColor = Color.Transparent; b.Click += h; return b;
    }

    Panel Tbs()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(22, 22, 24) };
        btns = new Button[6];
        for (int i = 0; i < 6; i++) { var idx = i; var b = new Button { Text = names[i], Bounds = new Rectangle(6 + idx * 85, 3, 80, 28), FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, BackColor = Color.Transparent, ForeColor = mut, Font = new Font("Segoe UI", 9), Cursor = Cursors.Hand }; b.Click += (s, e) => Sel(idx); b.Paint += (s, e) => { var ia = idx == tab; using (var br = new SolidBrush(ia ? acc : Color.Transparent)) e.Graphics.FillRectangle(br, b.Bounds); if (ia) e.Graphics.FillRectangle(Brushes.White, b.Bounds.X, b.Bounds.Bottom - 2, b.Bounds.Width, 2); using (var br2 = new SolidBrush(ia ? Color.White : mut)) { var sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center }; e.Graphics.DrawString(b.Text, b.Font, br2, b.Bounds, sf); } }; p.Controls.Add(b); btns[i] = b; }
        return p;
    }

    Panel Cnt() { var p = new Panel { Dock = DockStyle.Fill, BackColor = bg }; pages[0] = BldSr(); pages[1] = BldSt(); pages[2] = BldHb(); pages[3] = BldFv(); pages[4] = BldAi(); pages[5] = BldNt(); foreach (var tp in pages) { tp.Visible = false; p.Controls.Add(tp); } return p; }
    void Sel(int idx) { tab = idx; for (int i = 0; i < 6; i++) pages[i].Visible = i == idx; foreach (var b in btns) b.Invalidate(); if (idx == 3) RfFv(); if (idx == 5) RfNt(); }

    Panel BldSr()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        si = new TextBox { Location = new Point(10, 10), Width = p.Width - 20, BackColor = pnl, ForeColor = txt, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10) };
        si.TextChanged += (s, e) => Sr(); p.Controls.Add(si);
        sr = new FlowLayoutPanel { Location = new Point(0, 48), Size = new Size(p.Width, p.Height - 48), AutoScroll = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, BackColor = Color.Transparent };
        p.Controls.Add(sr);
        dp = new Panel { Visible = false, BackColor = pnl, BorderStyle = BorderStyle.FixedSingle }; p.Controls.Add(dp);
        p.Resize += (s, e) => { si.Width = p.Width - 20; sr.Size = new Size(p.Width, p.Height - 48); };
        Sr(); return p;
    }

    void Sr() { sr.Controls.Clear(); var q = (si.Text ?? "").Trim(); foreach (var a in AppData.Popular) { if (!string.IsNullOrEmpty(q) && a.Number.IndexOf(q, StringComparison.OrdinalIgnoreCase) < 0 && a.Title.IndexOf(q, StringComparison.OrdinalIgnoreCase) < 0) continue; sr.Controls.Add(Cd(a, (s, e) => Dt(a))); } }

    void Dt(PopItem a)
    {
        if (dp.Visible && dp.Tag == a) { dp.Visible = false; return; }
        dp.Visible = true; dp.Tag = a; dp.BringToFront();
        int dw = Math.Min(340, Width - 40); dp.Size = new Size(dw, Height - 100); dp.Location = new Point(Width - dw - 100, 50); dp.Controls.Clear();
        var sb = new StringBuilder(); sb.AppendLine(a.Number); sb.AppendLine(a.Title); sb.AppendLine(); sb.AppendLine(a.Text);
        if (!string.IsNullOrEmpty(a.Fine)) sb.AppendLine("\nШтраф до " + a.Fine + " руб.");
        sb.AppendLine(a.Codec);
        var lb = new Label { Text = sb.ToString(), ForeColor = txt, Font = new Font("Segoe UI", 9), Padding = new Padding(12), AutoSize = true, MaximumSize = new Size(dw - 20, 0) };
        dp.Controls.Add(lb);
        var cl = new Button { Text = "X", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = mut, BackColor = Color.Transparent, Size = new Size(28, 24), Location = new Point(dw - 34, 4), Cursor = Cursors.Hand };
        cl.Click += (s, e) => dp.Visible = false; dp.Controls.Add(cl);
    }

    Panel BldSt()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        var sc = new Panel { Dock = DockStyle.Fill, AutoScroll = true };
        var lst = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Width = 480, BackColor = Color.Transparent };
        sc.Controls.Add(lst); string last = "";
        foreach (var a in AppData.Popular) { if (a.Type != last) { last = a.Type; lst.Controls.Add(new Label { Text = "— " + a.Type.ToUpper() + " —", ForeColor = acc, Font = new Font("Segoe UI", 9, FontStyle.Bold), AutoSize = true, Padding = new Padding(10, 8, 0, 2) }); } lst.Controls.Add(Cd(a)); }
        p.Controls.Add(sc); return p;
    }

    Panel BldHb()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        var sp = new SplitContainer(); sp.Dock = DockStyle.Fill; sp.SplitterDistance = 180; sp.Panel1.BackColor = pnl; sp.Panel2.BackColor = bg;
        hl = new ListBox(); hl.Dock = DockStyle.Fill; hl.BackColor = pnl; hl.ForeColor = txt; hl.BorderStyle = BorderStyle.None; hl.Font = new Font("Segoe UI", 9);
        foreach (var h in AppData.Handbook) hl.Items.Add(h.Title);
        hl.SelectedIndexChanged += (s, e) => { if (hl.SelectedIndex >= 0) { var h = AppData.Handbook[hl.SelectedIndex]; var sb = new StringBuilder(); sb.AppendLine(h.Title); sb.AppendLine(); foreach (var l in h.Content) sb.AppendLine("• " + l); hc.Text = sb.ToString(); } };
        sp.Panel1.Controls.Add(hl);
        var sc2 = new Panel { Dock = DockStyle.Fill, AutoScroll = true }; hc = new Label { AutoSize = true, ForeColor = txt, Font = new Font("Segoe UI", 9), Padding = new Padding(12), MaximumSize = new Size(280, 0) }; sc2.Controls.Add(hc); sp.Panel2.Controls.Add(sc2);
        if (AppData.Handbook.Count > 0) hl.SelectedIndex = 0;
        p.Controls.Add(sp); return p;
    }

    Panel BldFv() { var p = new Panel { Dock = DockStyle.Fill, BackColor = bg }; var sc = new Panel { Dock = DockStyle.Fill, AutoScroll = true }; fl = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Width = 480, BackColor = Color.Transparent }; sc.Controls.Add(fl); p.Controls.Add(sc); return p; }
    void RfFv() { fl.Controls.Clear(); foreach (var a in AppData.Popular) if (a.IsFav) fl.Controls.Add(Cd(a)); if (fl.Controls.Count == 0) fl.Controls.Add(new Label { Text = "Избранное пусто", ForeColor = mut, Font = new Font("Segoe UI", 10), Padding = new Padding(20, 20, 0, 0), AutoSize = true }); }

    Panel Cd(PopItem a, EventHandler onClick = null)
    {
        var cd = new Panel { Size = new Size(460, 70), BackColor = pnl, Margin = new Padding(5, 3, 5, 3), Cursor = Cursors.Hand };
        if (onClick != null) cd.Click += onClick;
        cd.Controls.Add(new Label { Text = a.Number, ForeColor = acc, Font = new Font("Segoe UI", 8, FontStyle.Bold), Location = new Point(8, 6), AutoSize = true });
        var t = a.Title ?? ""; cd.Controls.Add(new Label { Text = t.Length > 68 ? t.Substring(0, 65) + "..." : t, ForeColor = txt, Font = new Font("Segoe UI", 9), Location = new Point(8, 24), Size = new Size(360, 18) });
        if (!string.IsNullOrEmpty(a.Fine)) cd.Controls.Add(new Label { Text = "до " + a.Fine + " руб", ForeColor = Color.FromArgb(255, 200, 100), Font = new Font("Segoe UI", 8), Location = new Point(8, 46), AutoSize = true });
        var bdg = new Label { Text = a.Type == "уголовная" ? "УК" : a.Type == "административная" ? "КоАП" : "ДК", ForeColor = a.Type == "уголовная" ? Color.FromArgb(255, 120, 120) : Color.FromArgb(120, 200, 255), Font = new Font("Segoe UI", 7, FontStyle.Bold), Size = new Size(34, 18), Location = new Point(cd.Width - 42, 5), TextAlign = ContentAlignment.MiddleCenter, BackColor = Color.FromArgb(30, 30, 33) };
        cd.Controls.Add(bdg);
        var star = new Label { Text = a.IsFav ? "★" : "☆", ForeColor = a.IsFav ? Color.FromArgb(255, 200, 50) : mut, Font = new Font("Segoe UI", 12), Location = new Point(cd.Width - 36, 44), AutoSize = true, Cursor = Cursors.Hand };
        star.Click += (s, e) => { a.IsFav = !a.IsFav; star.Text = a.IsFav ? "★" : "☆"; star.ForeColor = a.IsFav ? Color.FromArgb(255, 200, 50) : mut; AppData.SaveFav(); };
        cd.Controls.Add(star);
        cd.Resize += (s, e) => { bdg.Location = new Point(cd.Width - 42, 5); star.Location = new Point(cd.Width - 36, 44); };
        cd.MouseEnter += (s, e) => cd.BackColor = Color.FromArgb(34, 34, 38); cd.MouseLeave += (s, e) => cd.BackColor = pnl;
        return cd;
    }

    Panel BldAi()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        ac = new RichTextBox { Dock = DockStyle.Fill, BackColor = pnl, ForeColor = txt, BorderStyle = BorderStyle.None, Font = new Font("Segoe UI", 9), ReadOnly = true }; p.Controls.Add(ac);
        var bot = new Panel { Dock = DockStyle.Bottom, Height = 64, BackColor = hdr };
        ai = new TextBox { Location = new Point(8, 10), Size = new Size(bot.Width - 76, 44), Multiline = true, BackColor = pnl, ForeColor = txt, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 9) }; bot.Controls.Add(ai);
        ab = new Button { Text = ">", Location = new Point(bot.Width - 60, 10), Size = new Size(50, 44), FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, BackColor = acc, ForeColor = Color.White, Font = new Font("Segoe UI", 14), Cursor = Cursors.Hand };
        ab.Click += async (s, e) => await SAi(); ai.KeyDown += (s, e) => { if (e.Control && e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; ab.PerformClick(); } }; bot.Controls.Add(ab);
        bot.Resize += (s, e) => { ai.Width = bot.Width - 76; ab.Location = new Point(bot.Width - 60, 10); }; p.Controls.Add(bot);
        foreach (var m in AppData.AiHistory) AC(m.Role == "user" ? "Вы" : "ИИ", m.Content);
        return p;
    }

    void AC(string who, string text) { ac.SelectionStart = ac.TextLength; ac.SelectionLength = 0; ac.SelectionColor = who == "Вы" ? Color.FromArgb(180, 200, 255) : Color.FromArgb(160, 220, 160); ac.SelectionFont = new Font("Segoe UI", 9, FontStyle.Bold); ac.AppendText(who + ": "); ac.SelectionColor = txt; ac.SelectionFont = new Font("Segoe UI", 9); ac.AppendText(text + "\n\n"); ac.ScrollToCaret(); }

    async System.Threading.Tasks.Task SAi()
    {
        var text = (ai.Text ?? "").Trim(); if (string.IsNullOrEmpty(text)) return;
        ai.Text = ""; ai.Enabled = false; ab.Enabled = false;
        AC("Вы", text); AppData.AiHistory.Add(new AiMsg { Role = "user", Content = text });
        try { await ET(); var r = await CG(); AC("ИИ", r); AppData.AiHistory.Add(new AiMsg { Role = "assistant", Content = r }); AppData.SaveAi(); }
        catch (System.Exception ex) { AC("ИИ", "[Ошибка: " + ex.Message + "]"); }
        ai.Enabled = true; ab.Enabled = true; ai.Focus();
    }

    string aiTok; System.DateTime aiExp;
    async System.Threading.Tasks.Task ET()
    {
        if (!string.IsNullOrEmpty(aiTok) && System.DateTime.Now < aiExp) return;
        using (var cl = new System.Net.Http.HttpClient()) { cl.BaseAddress = new Uri("https://ngw.devices.sberbank.ru:9443/"); var creds = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("01a02dc3-626e-7cfb-8527-d36e4cc97a3c:a2f65377-6796-46a5-93b9-4d37231e993d")); var req = new System.Net.Http.HttpRequestMessage(System.Net.Http.HttpMethod.Post, "api/v2/oauth"); req.Headers.Add("Authorization", "Basic " + creds); req.Headers.Add("RqUID", System.Guid.NewGuid().ToString()); req.Content = new System.Net.Http.StringContent("scope=GIGA_CHAT_API_CORP", System.Text.Encoding.UTF8, "application/x-www-form-urlencoded"); var res = await cl.SendAsync(req); res.EnsureSuccessStatusCode(); var json = await res.Content.ReadAsStringAsync(); var tk = System.Text.RegularExpressions.Regex.Match(json, "\"access_token\"\\s*:\\s*\"([^\"]+)\""); var ex = System.Text.RegularExpressions.Regex.Match(json, "\"expires_at\"\\s*:\\s*(\\d+)"); if (tk.Success) { aiTok = tk.Groups[1].Value; long ext = long.Parse(ex.Groups[1].Value); aiExp = System.DateTimeOffset.FromUnixTimeSeconds(ext).DateTime; } else throw new Exception("No token"); }
    }

    async System.Threading.Tasks.Task<string> CG()
    {
        using (var cl = new System.Net.Http.HttpClient()) { cl.BaseAddress = new Uri("https://gigachat.devices.sberbank.ru/"); cl.DefaultRequestHeaders.Add("Authorization", "Bearer " + aiTok); var sb = new StringBuilder(); sb.Append("[{\"role\":\"system\",\"content\":\"Ты правовой помощник\"}"); int st = Math.Max(0, AppData.AiHistory.Count - 10); for (int i = st; i < AppData.AiHistory.Count; i++) { var rl = AppData.AiHistory[i].Role == "user" ? "user" : "assistant"; sb.Append(",{\"role\":\"" + rl + "\",\"content\":\"" + Es(AppData.AiHistory[i].Content) + "\"}"); } sb.Append("]"); var body = "{\"model\":\"GigaChat\",\"messages\":" + sb.ToString() + ",\"temperature\":0.7,\"max_tokens\":2000}"; var cnt = new System.Net.Http.StringContent(body, System.Text.Encoding.UTF8, "application/json"); var res = await cl.PostAsync("api/v1/chat/completions", cnt); res.EnsureSuccessStatusCode(); var json = await res.Content.ReadAsStringAsync(); var m = System.Text.RegularExpressions.Regex.Match(json, "\"content\"\\s*:\\s*\"([^\"]+)\""); if (m.Success) return m.Groups[1].Value.Replace("\\n", "\n"); return "(нет ответа)"; }
    }

    string Es(string s) { return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n"); }

    Panel BldNt()
    {
        var p = new Panel { Dock = DockStyle.Fill, BackColor = bg };
        var ad = new Button { Text = "+ Новая заметка", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, BackColor = acc, ForeColor = Color.White, Font = new Font("Segoe UI", 9, FontStyle.Bold), Cursor = Cursors.Hand, Size = new Size(140, 32), Location = new Point(10, 10) };
        ad.Click += (s, e) => { AppData.Notes.Add(new NoteItem { Id = DateTime.Now.Ticks, Title = "Новая заметка" }); AppData.SaveNotes(); RfNt(); }; p.Controls.Add(ad);
        var sc = new Panel { Dock = DockStyle.Fill, AutoScroll = true };
        var np = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Width = 460, BackColor = Color.Transparent }; sc.Controls.Add(np); p.Controls.Add(sc);
        p.Resize += (s, e) => np.Width = p.Width - 20; RfNt(); return p;
    }

    void RfNt()
    {
        var np = (pages[5].Controls[1] as Panel).Controls[0] as FlowLayoutPanel; np.Controls.Clear();
        foreach (var n in AppData.Notes)
        {
            var card = new Panel { Size = new Size(np.Width, 80), BackColor = pnl, Margin = new Padding(5, 3, 5, 3) }; long nId = n.Id;
            var tb = new TextBox { Text = n.Title, ForeColor = txt, BackColor = pnl, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10, FontStyle.Bold), Location = new Point(8, 6), Size = new Size(card.Width - 80, 24) };
            tb.TextChanged += (s, e) => { var nt = AppData.Notes.FirstOrDefault(x => x.Id == nId); if (nt != null) nt.Title = tb.Text; AppData.SaveNotes(); }; card.Controls.Add(tb);
            var db = new Button { Text = "X", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = Color.FromArgb(230, 90, 90), BackColor = Color.Transparent, Size = new Size(26, 22), Location = new Point(card.Width - 32, 6), Cursor = Cursors.Hand };
            db.Click += (s, e) => { AppData.Notes.RemoveAll(x => x.Id == nId); AppData.SaveNotes(); RfNt(); }; card.Controls.Add(db);
            var cl = new Label { Text = n.Items.Count + " пунктов", ForeColor = mut, Font = new Font("Segoe UI", 8), Location = new Point(10, 34), AutoSize = true }; card.Controls.Add(cl);
            var ob = new Button { Text = "Открыть", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = Color.FromArgb(120, 200, 255), BackColor = Color.Transparent, Cursor = Cursors.Hand, Size = new Size(70, 22), Location = new Point(10, 52) };
            ob.Click += (s, e) => { var f = new Form { Text = n.Title, Size = new Size(380, 420), StartPosition = FormStartPosition.CenterParent, BackColor = bg, ForeColor = txt, FormBorderStyle = FormBorderStyle.FixedDialog, MinimizeBox = false, MaximizeBox = false, ShowInTaskbar = false, TopMost = top }; var tb2 = new TextBox { Text = n.Title, ForeColor = txt, BackColor = pnl, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 11, FontStyle.Bold), Dock = DockStyle.Top, Height = 32, Padding = new Padding(8) }; long nId2 = n.Id; tb2.TextChanged += (s2, e2) => { var nt = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nt != null) nt.Title = tb2.Text; AppData.SaveNotes(); }; f.Controls.Add(tb2); var sc2 = new Panel { Dock = DockStyle.Fill, AutoScroll = true }; var ip = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false, Width = 340, BackColor = Color.Transparent }; sc2.Controls.Add(ip); f.Controls.Add(sc2); var ab2 = new Button { Text = "+ Добавить пункт", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = Color.FromArgb(120, 200, 255), BackColor = Color.Transparent, Cursor = Cursors.Hand, Size = new Size(140, 28), Dock = DockStyle.Bottom }; f.Controls.Add(ab2); System.Action rd = null; rd = () => { ip.Controls.Clear(); var nt = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nt == null) return; for (int i = 0; i < nt.Items.Count; i++) { var idx = i; var it = nt.Items[i]; var row = new Panel { Size = new Size(340, 30), BackColor = Color.Transparent, Margin = new Padding(0, 1, 0, 1) }; var cb = new CheckBox { Checked = it.Done, Location = new Point(4, 6), Size = new Size(18, 18), BackColor = Color.Transparent, ForeColor = txt }; cb.CheckedChanged += (s2, e2) => { var nn = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nn != null && idx < nn.Items.Count) { nn.Items[idx].Done = cb.Checked; AppData.SaveNotes(); } }; row.Controls.Add(cb); var inp = new TextBox { Text = it.Text, Location = new Point(26, 4), Size = new Size(280, 22), ForeColor = txt, BackColor = pnl, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 9) }; inp.TextChanged += (s2, e2) => { var nn = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nn != null && idx < nn.Items.Count) { nn.Items[idx].Text = inp.Text; AppData.SaveNotes(); } }; row.Controls.Add(inp); var rm = new Button { Text = "X", FlatStyle = FlatStyle.Flat, FlatAppearance = { BorderSize = 0 }, ForeColor = Color.FromArgb(230, 90, 90), BackColor = Color.Transparent, Cursor = Cursors.Hand, Size = new Size(22, 20), Location = new Point(314, 4), Font = new Font("Segoe UI", 7) }; rm.Click += (s2, e2) => { var nn = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nn != null && idx < nn.Items.Count) { nn.Items.RemoveAt(idx); AppData.SaveNotes(); rd(); } }; row.Controls.Add(rm); ip.Controls.Add(row); } }; ab2.Click += (s2, e2) => { var nt = AppData.Notes.FirstOrDefault(x => x.Id == nId2); if (nt != null) { nt.Items.Add(new CheckItem { Text = "", Done = false }); AppData.SaveNotes(); rd(); } }; f.FormClosed += (s2, e2) => RfNt(); rd(); f.Shown += (s2, e2) => { sc2.Location = new Point(0, 32); sc2.Height = f.ClientSize.Height - 32 - ab2.Height; }; f.Show(this); };
            card.Controls.Add(ob); np.Controls.Add(card);
        }
        if (AppData.Notes.Count == 0) np.Controls.Add(new Label { Text = "Нет заметок", ForeColor = mut, Font = new Font("Segoe UI", 10), Padding = new Padding(20, 20, 0, 0), AutoSize = true });
    }

    void Drg() { if (pin) return; NativeMethods.ReleaseCapture(); NativeMethods.SendMessage(Handle, 0xA1, 0x2, 0); }
}

public static class NativeMethods
{
    [DllImport("user32.dll")] public static extern bool ReleaseCapture();
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, int m, int w, int l);
}

public static class Program
{
    [STAThread]
    public static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new HelperForm());
    }
}