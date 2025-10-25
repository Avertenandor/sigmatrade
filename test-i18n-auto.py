# Автоматический тест системы i18n
# Запускает проверки и собирает результаты

import asyncio
import json
from pathlib import Path
import re
from typing import Dict, List, Any

def check_files_exist() -> Dict[str, Any]:
    """Проверка наличия всех необходимых файлов."""
    base_dir = Path(".")
    results = {
        "status": "success",
        "files_checked": 0,
        "files_found": 0,
        "files_missing": [],
        "details": {}
    }
    
    required_files = {
        "JS": ["i18n.js", "lang-switcher.js", "premium-nav.js", "site-interactions.js"],
        "CSS": ["fixed-header.css", "premium-nav.css", "lang-switcher.css"],
        "HTML": ["index.html", "login.html", "test-i18n-full.html", "test-lang-button-pages.html"]
    }
    
    for category, files in required_files.items():
        results["details"][category] = {}
        for file in files:
            file_path = base_dir / file
            results["files_checked"] += 1
            if file_path.exists():
                results["files_found"] += 1
                results["details"][category][file] = {
                    "exists": True,
                    "size": file_path.stat().st_size
                }
            else:
                results["files_missing"].append(file)
                results["details"][category][file] = {"exists": False}
                results["status"] = "error"
    
    return results

def check_locales() -> Dict[str, Any]:
    """Проверка файлов локализации."""
    locales_dir = Path("locales")
    results = {
        "status": "success",
        "locales_found": 0,
        "locales_expected": 19,
        "locales_missing": [],
        "details": {}
    }
    
    expected_locales = [
        "ru", "en", "de", "tr", "uk", "ro", "es", "fr", "it", "pl",
        "vi", "id", "ar", "zh", "zh-Hans", "zh-Hant", "ja", "kk", "pt"
    ]
    
    if not locales_dir.exists():
        results["status"] = "error"
        results["error"] = "Папка locales не найдена"
        return results
    
    for locale in expected_locales:
        locale_file = locales_dir / f"{locale}.json"
        if locale_file.exists():
            results["locales_found"] += 1
            try:
                with open(locale_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    results["details"][locale] = {
                        "exists": True,
                        "keys": len(data),
                        "size": locale_file.stat().st_size
                    }
            except Exception as e:
                results["details"][locale] = {
                    "exists": True,
                    "error": str(e)
                }
                results["status"] = "warning"
        else:
            results["locales_missing"].append(locale)
            results["details"][locale] = {"exists": False}
            results["status"] = "error"
    
    return results

def check_i18n_config() -> Dict[str, Any]:
    """Проверка конфигурации i18n.js."""
    results = {
        "status": "success",
        "available_locales": [],
        "default_locale": None,
        "version": None,
        "details": {}
    }
    
    i18n_file = Path("i18n.js")
    if not i18n_file.exists():
        results["status"] = "error"
        results["error"] = "Файл i18n.js не найден"
        return results
    
    try:
        with open(i18n_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Извлекаем AVAILABLE_LOCALES
        locales_match = re.search(r'AVAILABLE_LOCALES\s*=\s*\[(.*?)\]', content, re.DOTALL)
        if locales_match:
            locales_str = locales_match.group(1)
            # Извлекаем все строки в кавычках
            locales = re.findall(r'"([^"]+)"', locales_str)
            results["available_locales"] = locales
            results["details"]["locales_count"] = len(locales)
        
        # Извлекаем DEFAULT_LOCALE
        default_match = re.search(r'DEFAULT_LOCALE\s*=\s*"([^"]+)"', content)
        if default_match:
            results["default_locale"] = default_match.group(1)
        
        # Извлекаем I18N_VERSION
        version_match = re.search(r'I18N_VERSION\s*=\s*"([^"]+)"', content)
        if version_match:
            results["version"] = version_match.group(1)
        
        # Проверяем DEBUG режим
        debug_match = re.search(r'DEBUG\s*=\s*(true|false)', content, re.IGNORECASE)
        if debug_match:
            results["details"]["debug_mode"] = debug_match.group(1).lower() == 'true'
        
    except Exception as e:
        results["status"] = "error"
        results["error"] = str(e)
    
    return results

def check_html_integration() -> Dict[str, Any]:
    """Проверка интеграции скриптов в HTML файлах."""
    results = {
        "status": "success",
        "pages_checked": 0,
        "pages_with_i18n": 0,
        "details": {}
    }
    
    html_files = ["index.html", "login.html"]
    
    for html_file in html_files:
        file_path = Path(html_file)
        results["pages_checked"] += 1
        page_result = {
            "exists": False,
            "has_i18n_js": False,
            "has_lang_switcher_js": False,
            "has_premium_nav_js": False,
            "has_premium_nav_css": False,
            "data_i18n_count": 0
        }
        
        if not file_path.exists():
            results["details"][html_file] = page_result
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            page_result["exists"] = True
            page_result["has_i18n_js"] = 'i18n.js' in content
            page_result["has_lang_switcher_js"] = 'lang-switcher.js' in content
            page_result["has_premium_nav_js"] = 'premium-nav.js' in content
            page_result["has_premium_nav_css"] = 'premium-nav.css' in content
            
            # Подсчёт элементов data-i18n
            data_i18n_matches = re.findall(r'data-i18n=', content)
            page_result["data_i18n_count"] = len(data_i18n_matches)
            
            if page_result["has_i18n_js"] and page_result["has_lang_switcher_js"]:
                results["pages_with_i18n"] += 1
            
        except Exception as e:
            page_result["error"] = str(e)
            results["status"] = "warning"
        
        results["details"][html_file] = page_result
    
    return results

def generate_report(results: Dict[str, Dict[str, Any]]) -> str:
    """Генерация отчёта в текстовом формате."""
    report = []
    report.append("=" * 80)
    report.append("ОТЧЁТ О ПРОВЕРКЕ СИСТЕМЫ I18N")
    report.append("=" * 80)
    report.append("")
    
    # 1. Проверка файлов
    files_check = results["files"]
    report.append("📁 ПРОВЕРКА ФАЙЛОВ:")
    report.append(f"  Статус: {files_check['status'].upper()}")
    report.append(f"  Проверено: {files_check['files_checked']}")
    report.append(f"  Найдено: {files_check['files_found']}")
    if files_check['files_missing']:
        report.append(f"  ❌ Отсутствуют: {', '.join(files_check['files_missing'])}")
    else:
        report.append("  ✅ Все файлы на месте")
    report.append("")
    
    # 2. Проверка локалей
    locales_check = results["locales"]
    report.append("🌐 ПРОВЕРКА ЛОКАЛЕЙ:")
    report.append(f"  Статус: {locales_check['status'].upper()}")
    report.append(f"  Ожидается: {locales_check['locales_expected']}")
    report.append(f"  Найдено: {locales_check['locales_found']}")
    if locales_check['locales_missing']:
        report.append(f"  ❌ Отсутствуют: {', '.join(locales_check['locales_missing'])}")
    else:
        report.append("  ✅ Все локали на месте")
    
    # Детали по локалям
    if locales_check['details']:
        report.append("\n  Детали:")
        for locale, info in sorted(locales_check['details'].items()):
            if info['exists']:
                keys = info.get('keys', '?')
                report.append(f"    • {locale:10} - {keys:4} ключей")
    report.append("")
    
    # 3. Конфигурация i18n
    config_check = results["config"]
    report.append("⚙️  КОНФИГУРАЦИЯ I18N:")
    report.append(f"  Статус: {config_check['status'].upper()}")
    report.append(f"  Версия: {config_check.get('version', 'не найдена')}")
    report.append(f"  Язык по умолчанию: {config_check.get('default_locale', 'не найден')}")
    report.append(f"  Доступных языков: {len(config_check.get('available_locales', []))}")
    
    if config_check.get('available_locales'):
        locales_str = ', '.join(config_check['available_locales'])
        report.append(f"  Список: {locales_str}")
    
    debug = config_check.get('details', {}).get('debug_mode')
    if debug is not None:
        report.append(f"  Debug режим: {'✅ ВКЛЮЧЁН' if debug else '❌ ВЫКЛЮЧЕН'}")
    report.append("")
    
    # 4. Интеграция в HTML
    html_check = results["html"]
    report.append("📄 ИНТЕГРАЦИЯ В HTML:")
    report.append(f"  Статус: {html_check['status'].upper()}")
    report.append(f"  Проверено страниц: {html_check['pages_checked']}")
    report.append(f"  Со скриптами i18n: {html_check['pages_with_i18n']}")
    report.append("")
    
    for page, info in html_check['details'].items():
        if not info['exists']:
            report.append(f"  ❌ {page} - файл не найден")
            continue
        
        status = "✅" if (info['has_i18n_js'] and info['has_lang_switcher_js']) else "❌"
        report.append(f"  {status} {page}:")
        report.append(f"      i18n.js: {'✅' if info['has_i18n_js'] else '❌'}")
        report.append(f"      lang-switcher.js: {'✅' if info['has_lang_switcher_js'] else '❌'}")
        report.append(f"      premium-nav.js: {'✅' if info['has_premium_nav_js'] else '❌'}")
        report.append(f"      data-i18n элементов: {info['data_i18n_count']}")
    
    report.append("")
    report.append("=" * 80)
    
    # Общий итог
    all_success = all(r['status'] == 'success' for r in results.values())
    if all_success:
        report.append("🎉 ИТОГ: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!")
    else:
        report.append("⚠️  ИТОГ: ОБНАРУЖЕНЫ ПРОБЛЕМЫ. СМ. ДЕТАЛИ ВЫШЕ.")
    report.append("=" * 80)
    
    return '\n'.join(report)

def main():
    """Главная функция."""
    print("🔍 Запуск автоматической проверки системы i18n...\n")
    
    results = {
        "files": check_files_exist(),
        "locales": check_locales(),
        "config": check_i18n_config(),
        "html": check_html_integration()
    }
    
    # Генерация отчёта
    report = generate_report(results)
    print(report)
    
    # Сохранение в файл
    report_file = Path("test-i18n-report.txt")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"\n📝 Отчёт сохранён в: {report_file}")
    
    # Сохранение JSON
    json_file = Path("test-i18n-results.json")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"📊 Детальные результаты (JSON): {json_file}")

if __name__ == "__main__":
    main()
